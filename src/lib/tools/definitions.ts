import type { ChatCompletionTool } from "groq-sdk/resources/chat/completions";
import { z } from "zod";
import { toolInputSchemas, type ToolName } from "@/lib/validation/tool-inputs";

const toolDescriptions: Record<ToolName, string> = {
  get_transaction:
    "Look up one payment transaction. Pass only transaction_reference, an external reference such as PAY-1001. The result data contains the UUID fields required by related tools. Related fields such as invoice_id and provider_error_code may be null; null means skip the corresponding tool and never invent a replacement.",
  get_account:
    "Retrieve the payment account and recorded balance/status. Pass only account_id: the UUID returned in get_transaction result data.account_id. Never pass PAY-1001, transaction_reference, an account name, or data.id.",
  get_party:
    "Retrieve the customer or supplier. Pass only party_id: the UUID returned in get_transaction result data.party_id. Never pass a transaction reference or party name.",
  get_invoice:
    "Retrieve the related invoice. Pass only invoice_id: the UUID returned in get_transaction result data.invoice_id. Do not call this tool when that value is null.",
  get_payment_attempts:
    "List recorded attempts for a transaction. Pass only transaction_id: the transaction UUID returned in get_transaction result data.id. The property is transaction_id, never transaction_uuid or transaction_reference.",
  check_duplicate_transactions:
    "Check for possible duplicates. Pass only transaction_id: the transaction UUID returned in get_transaction result data.id. Never pass PAY-1001 or transaction_reference.",
  get_provider_error:
    "Look up the provider-authored meaning of an error only when get_transaction result data.provider_error_code is a non-null string. Pass only code from data.provider_error_code and provider from data.provider. If provider_error_code is null or missing, this tool is not applicable: skip it and never invent an error code.",
  create_support_ticket:
    "Optionally create a pending technical support ticket only when evidence indicates a provider, processor, integration, or system issue requiring support investigation. Do not use this for a healthy completed payment or when no follow-up is required. Do not use this for funding review, retry authorization, or another financial decision; use create_approval_request instead. Pass only title and description. The server supplies investigation_id. This never executes or retries a payment.",
  create_approval_request:
    "Optionally create a pending approval request only when the safe next step requires a human financial decision or authorization, including funding review or approval before a payment retry. Do not use this for a healthy completed payment or when no follow-up is required. Pass only title and description. The server supplies investigation_id. This never approves, retries, or performs a financial action.",
  verify_action_request:
    "Verify an action created in the current investigation. Pass only action_request_id: the UUID returned in create_support_ticket or create_approval_request result data.id.",
};

function jsonSchemaFor(name: ToolName) {
  return z.toJSONSchema(toolInputSchemas[name], { target: "draft-07", io: "input" });
}

export const agentTools: ChatCompletionTool[] = (Object.keys(toolInputSchemas) as ToolName[]).map((name) => ({
  type: "function",
  function: {
    name,
    description: toolDescriptions[name],
    parameters: jsonSchemaFor(name),
  },
}));

export const toolNames = Object.keys(toolInputSchemas) as ToolName[];

export function getToolContractReminder(name?: string) {
  const prefix = name && name in toolDescriptions ? `${name} contract: ${toolDescriptions[name as ToolName]}` : "Use exact PayPart tool contracts.";
  return `${prefix}\nIdentifier mapping from get_transaction result data:\n- data.id -> transaction_id\n- data.account_id -> account_id\n- data.party_id -> party_id\n- non-null data.invoice_id -> invoice_id\n- non-null data.provider_error_code -> code\n- data.provider -> provider\nA null or missing source value makes the related tool inapplicable: skip it and never fabricate a replacement. Never use transaction_reference (for example PAY-1001) in a *_id property. Never rename *_id to *_uuid. Do not add properties outside the selected tool schema. JSON/json is not a tool; when evidence is sufficient, stop tool use and return the final report as assistant content.`;
}

interface ToolAvailabilityContext {
  transactionLoaded: boolean;
  invoice_id: string | null;
  provider_error_code: string | null;
}

export function availableAgentTools(
  blockedToolNames: ReadonlySet<string>,
  context?: ToolAvailabilityContext,
) {
  return agentTools.filter((tool) => {
    const name = tool.function?.name;
    if (!name || blockedToolNames.has(name)) return false;
    if (context && !context.transactionLoaded) return name === "get_transaction";
    if (context?.transactionLoaded && name === "get_transaction") return false;
    if (name === "get_invoice" && context?.invoice_id === null) return false;
    if (name === "get_provider_error" && context?.provider_error_code === null) return false;
    return true;
  });
}
