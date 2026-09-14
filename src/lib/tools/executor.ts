import "server-only";

import {
  addInvestigationEvent,
  createActionRequest,
  findDuplicateTransactions,
  getAccountById,
  getActionRequestById,
  getInvoiceById,
  getPartyById,
  getPaymentAttemptsByTransaction,
  getProviderError,
  getTransactionByReference,
  updateInvestigation,
} from "@/lib/database/repositories";
import type { ActionRequest, Json } from "@/lib/database/types";
import { getToolContractReminder } from "@/lib/tools/definitions";
import { isToolName, toolInputSchemas } from "@/lib/validation/tool-inputs";

export interface ToolExecutionContext {
  investigation_id: string;
  transaction_id: string | null;
  account_id: string | null;
  party_id: string | null;
  invoice_id: string | null;
  provider: string | null;
  provider_error_code: string | null;
  investigative_tool_calls: number;
  action_request_ids: Set<string>;
  unverified_action_request_ids: Set<string>;
  invalid_tool_attempts: Map<string, number>;
  blocked_tool_names: Set<string>;
}

export interface ToolExecutionResult {
  ok: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  error_code?: "INVALID_TOOL_ARGUMENTS" | "UNTRUSTED_IDENTIFIER" | "TOOL_EXECUTION_FAILED" | "UNKNOWN_TOOL";
  retryable?: boolean;
  contract?: string;
  trusted_ids?: Partial<{
    transaction_id: string;
    account_id: string;
    party_id: string;
    invoice_id: string | null;
    action_request_id: string;
  }>;
}

export interface ToolProgress {
  type: "tool_call" | "tool_result" | "action_created" | "action_verified";
  toolName: string;
  input?: Json;
  output?: Json;
}

type ProgressHandler = (progress: ToolProgress) => void | Promise<void>;

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function messageForMissing(entity: string): ToolExecutionResult {
  return { ok: true, data: null, message: `${entity} was not found in the database.` };
}

function contractFailure(
  context: ToolExecutionContext,
  toolName: string,
  error: string,
  errorCode: "INVALID_TOOL_ARGUMENTS" | "UNTRUSTED_IDENTIFIER" = "INVALID_TOOL_ARGUMENTS",
): ToolExecutionResult {
  const attempts = (context.invalid_tool_attempts.get(toolName) ?? 0) + 1;
  context.invalid_tool_attempts.set(toolName, attempts);
  if (attempts >= 2) context.blocked_tool_names.add(toolName);

  return {
    ok: false,
    error,
    error_code: errorCode,
    retryable: attempts < 2,
    contract: getToolContractReminder(toolName),
    message:
      attempts < 2
        ? "Inspect the latest get_transaction result and retry once with the exact property and returned value."
        : "This tool is disabled for the remainder of this investigation after two invalid calls. Continue with other evidence or finish with an explicit limitation.",
  };
}

function trustedIdFailure(
  context: ToolExecutionContext,
  toolName: string,
  property: string,
  received: string,
  expected: string | null,
) {
  if (context.transaction_id && expected === null) {
    context.blocked_tool_names.add(toolName);
    return {
      ok: false,
      error: `get_transaction returned no ${property}; ${toolName} is not applicable to this transaction.`,
      error_code: "UNTRUSTED_IDENTIFIER" as const,
      retryable: false,
      contract: getToolContractReminder(toolName),
      message: "Skip this tool. Continue with other available evidence or finish the investigation; do not invent a replacement value.",
    };
  }

  const source = expected
    ? `The only allowed ${property} for this investigation is the value returned by get_transaction: ${expected}.`
    : `No trusted ${property} is available. Call get_transaction first and use the corresponding returned field.`;
  return contractFailure(
    context,
    toolName,
    `${property} '${received}' was not supplied by a previous trusted tool result. ${source}`,
    "UNTRUSTED_IDENTIFIER",
  );
}

async function persistResult(
  context: ToolExecutionContext,
  toolName: string,
  input: Json,
  result: ToolExecutionResult,
  onProgress?: ProgressHandler,
) {
  const output = toJson(result);
  await addInvestigationEvent({
    investigation_id: context.investigation_id,
    event_type: "tool_result",
    tool_name: toolName,
    input,
    output,
  });
  await onProgress?.({ type: "tool_result", toolName, input, output });
}

export async function executeTool(
  context: ToolExecutionContext,
  toolName: string,
  rawArguments: string,
  onProgress?: ProgressHandler,
): Promise<ToolExecutionResult> {
  let rawInput: unknown;
  try {
    rawInput = JSON.parse(rawArguments);
  } catch {
    rawInput = { raw_arguments: rawArguments };
  }

  const input = toJson(rawInput);
  await addInvestigationEvent({
    investigation_id: context.investigation_id,
    event_type: "tool_call",
    tool_name: toolName,
    input,
  });
  await onProgress?.({ type: "tool_call", toolName, input });

  if (!isToolName(toolName)) {
    context.blocked_tool_names.add(toolName);
    const result: ToolExecutionResult = {
      ok: false,
      error: `Unknown tool: ${toolName}`,
      error_code: "UNKNOWN_TOOL",
      retryable: false,
    };
    await persistResult(context, toolName, input, result, onProgress);
    return result;
  }

  const parsed = toolInputSchemas[toolName].safeParse(rawInput);
  if (!parsed.success) {
    const result = contractFailure(
      context,
      toolName,
      `Invalid tool arguments for ${toolName}: ${parsed.error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ")}`,
    );
    await persistResult(context, toolName, input, result, onProgress);
    return result;
  }

  try {
    let result: ToolExecutionResult;

    switch (toolName) {
      case "get_transaction": {
        const args = toolInputSchemas.get_transaction.parse(rawInput);
        const data = await getTransactionByReference(args.transaction_reference);
        context.investigative_tool_calls += 1;
        if (data) {
          context.transaction_id = data.id;
          context.account_id = data.account_id;
          context.party_id = data.party_id;
          context.invoice_id = data.invoice_id;
          context.provider = data.provider;
          context.provider_error_code = data.provider_error_code;
          await updateInvestigation(context.investigation_id, { transaction_id: data.id });
          result = {
            ok: true,
            data,
            message: [
              "Trusted identifiers loaded: use data.id as transaction_id, data.account_id as account_id, and data.party_id as party_id.",
              data.invoice_id
                ? "Use data.invoice_id as invoice_id."
                : "data.invoice_id is null, so get_invoice is not applicable; do not invent an invoice_id.",
              data.provider_error_code
                ? "Use data.provider_error_code and data.provider for get_provider_error."
                : "data.provider_error_code is null, so get_provider_error is not applicable; do not invent an error code.",
            ].join(" "),
            trusted_ids: {
              transaction_id: data.id,
              account_id: data.account_id,
              party_id: data.party_id,
              invoice_id: data.invoice_id,
            },
          };
        } else {
          result = messageForMissing("Transaction");
        }
        break;
      }
      case "get_account": {
        const args = toolInputSchemas.get_account.parse(rawInput);
        if (args.account_id !== context.account_id) {
          result = trustedIdFailure(context, toolName, "account_id", args.account_id, context.account_id);
          break;
        }
        const data = await getAccountById(args.account_id);
        context.investigative_tool_calls += 1;
        result = data ? { ok: true, data } : messageForMissing("Account");
        break;
      }
      case "get_party": {
        const args = toolInputSchemas.get_party.parse(rawInput);
        if (args.party_id !== context.party_id) {
          result = trustedIdFailure(context, toolName, "party_id", args.party_id, context.party_id);
          break;
        }
        const data = await getPartyById(args.party_id);
        context.investigative_tool_calls += 1;
        result = data ? { ok: true, data } : messageForMissing("Party");
        break;
      }
      case "get_invoice": {
        const args = toolInputSchemas.get_invoice.parse(rawInput);
        if (args.invoice_id !== context.invoice_id) {
          result = trustedIdFailure(context, toolName, "invoice_id", args.invoice_id, context.invoice_id);
          break;
        }
        const data = await getInvoiceById(args.invoice_id);
        context.investigative_tool_calls += 1;
        result = data ? { ok: true, data } : messageForMissing("Invoice");
        break;
      }
      case "get_payment_attempts": {
        const args = toolInputSchemas.get_payment_attempts.parse(rawInput);
        if (args.transaction_id !== context.transaction_id) {
          result = trustedIdFailure(context, toolName, "transaction_id", args.transaction_id, context.transaction_id);
          break;
        }
        const data = await getPaymentAttemptsByTransaction(args.transaction_id);
        context.investigative_tool_calls += 1;
        result = { ok: true, data, message: data.length ? undefined : "No payment attempts were found." };
        break;
      }
      case "check_duplicate_transactions": {
        const args = toolInputSchemas.check_duplicate_transactions.parse(rawInput);
        if (args.transaction_id !== context.transaction_id) {
          result = trustedIdFailure(context, toolName, "transaction_id", args.transaction_id, context.transaction_id);
          break;
        }
        const data = await findDuplicateTransactions(args.transaction_id);
        context.investigative_tool_calls += 1;
        result = {
          ok: true,
          data,
          message: data.length ? `${data.length} possible duplicate(s) found.` : "No possible duplicate transactions found.",
        };
        break;
      }
      case "get_provider_error": {
        const args = toolInputSchemas.get_provider_error.parse(rawInput);
        if (context.transaction_id && context.provider_error_code === null) {
          context.blocked_tool_names.add(toolName);
          result = {
            ok: false,
            error: "get_transaction returned provider_error_code as null; get_provider_error is not applicable to this transaction.",
            error_code: "UNTRUSTED_IDENTIFIER",
            retryable: false,
            contract: getToolContractReminder(toolName),
            message: "Skip this tool and do not invent an error code. Continue with other evidence or finish the investigation.",
          };
          break;
        }
        if (args.code !== context.provider_error_code || args.provider !== context.provider) {
          result = contractFailure(
            context,
            toolName,
            "code and provider must exactly match data.provider_error_code and data.provider returned by get_transaction.",
            "UNTRUSTED_IDENTIFIER",
          );
          break;
        }
        const data = await getProviderError(args.code, args.provider);
        context.investigative_tool_calls += 1;
        result = data ? { ok: true, data } : messageForMissing("Provider error");
        break;
      }
      case "create_support_ticket":
      case "create_approval_request": {
        if (!context.transaction_id || context.investigative_tool_calls < 2) {
          result = {
            ok: false,
            error: "Controlled actions require a known transaction and at least two successful investigative tool calls.",
            error_code: "TOOL_EXECUTION_FAILED",
            retryable: true,
          };
          break;
        }
        const actionType: ActionRequest["action_type"] = toolName === "create_support_ticket" ? "support_ticket" : "approval_request";
        const args = toolInputSchemas[toolName].parse(rawInput);
        const data = await createActionRequest({
          investigation_id: context.investigation_id,
          action_type: actionType,
          title: args.title,
          description: args.description,
        });
        context.action_request_ids.add(data.id);
        context.unverified_action_request_ids.add(data.id);
        result = {
          ok: true,
          data,
          message: "Pending action request created. Use data.id as action_request_id for verify_action_request. No financial operation was executed.",
          trusted_ids: { action_request_id: data.id },
        };
        await addInvestigationEvent({
          investigation_id: context.investigation_id,
          event_type: "action_created",
          tool_name: toolName,
          output: toJson(data),
        });
        await onProgress?.({ type: "action_created", toolName, output: toJson(data) });
        break;
      }
      case "verify_action_request": {
        const args = toolInputSchemas.verify_action_request.parse(rawInput);
        if (!context.action_request_ids.has(args.action_request_id)) {
          result = trustedIdFailure(
            context,
            toolName,
            "action_request_id",
            args.action_request_id,
            Array.from(context.action_request_ids)[0] ?? null,
          );
          break;
        }
        const data = await getActionRequestById(args.action_request_id);
        if (!data || data.investigation_id !== context.investigation_id) {
          result = messageForMissing("Action request for this investigation");
          break;
        }
        context.unverified_action_request_ids.delete(data.id);
        result = { ok: true, data, message: `Action request exists with status '${data.status}'.` };
        await addInvestigationEvent({
          investigation_id: context.investigation_id,
          event_type: "action_verified",
          tool_name: toolName,
          output: toJson(data),
        });
        await onProgress?.({ type: "action_verified", toolName, output: toJson(data) });
        break;
      }
    }

    if (result.ok) context.invalid_tool_attempts.delete(toolName);
    await persistResult(context, toolName, input, result, onProgress);
    return result;
  } catch (error) {
    const result: ToolExecutionResult = {
      ok: false,
      error: error instanceof Error ? error.message : "Tool execution failed unexpectedly.",
      error_code: "TOOL_EXECUTION_FAILED",
      retryable: false,
    };
    await persistResult(context, toolName, input, result, onProgress);
    return result;
  }
}
