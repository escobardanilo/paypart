import "server-only";

import { APIError } from "groq-sdk";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";
import { z } from "zod";
import { getGroqClient, GROQ_MODEL } from "@/lib/ai/groq";
import {
  addInvestigationEvent,
  createInvestigation,
  getActionRequestById,
  updateInvestigation,
} from "@/lib/database/repositories";
import type { ActionRequest, Json } from "@/lib/database/types";
import { AGENT_SYSTEM_PROMPT, TOOL_IDENTIFIER_RULES } from "@/lib/agent/prompt";
import { availableAgentTools } from "@/lib/tools/definitions";
import { executeTool, type ToolExecutionContext, type ToolProgress } from "@/lib/tools/executor";
import { isToolName, toolInputSchemas } from "@/lib/validation/tool-inputs";

const MAX_ITERATIONS = 12;
const MAX_TOOL_GENERATION_ATTEMPTS = 2;

const finalReportSchema = z.strictObject({
  summary: z.string().min(1),
  diagnosis: z.string().min(1),
  recommendedAction: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  actionTaken: z.string().min(1),
});

export type FinalReport = z.infer<typeof finalReportSchema>;

export type AgentProgressEvent =
  | { type: "investigation_started"; investigation_id: string }
  | { type: "thinking"; iteration: number }
  | ToolProgress
  | { type: "completed"; investigation_id: string; report: FinalReport; actions: ActionRequest[] }
  | { type: "failed"; investigation_id?: string; error: string };

type ProgressHandler = (event: AgentProgressEvent) => void | Promise<void>;

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function parseFinalReport(content: string | null): FinalReport | null {
  if (!content) return null;
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return finalReportSchema.parse(JSON.parse(cleaned));
  } catch {
    return null;
  }
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "The investigation failed unexpectedly.";
}

interface FailedGenerationDetails {
  raw: string;
  toolName: string | null;
  arguments: unknown;
  validationError: string;
  finalReportAsTool: boolean;
}

function formatZodIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("; ");
}

function failedGenerationDetails(error: unknown): FailedGenerationDetails | null {
  if (!(error instanceof APIError) || error.status !== 400) return null;

  const body = error.error as Record<string, unknown> | undefined;
  const nested = body?.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : undefined;
  const failedGeneration = body?.failed_generation ?? nested?.failed_generation;
  if (!failedGeneration) return null;

  const raw = (typeof failedGeneration === "string" ? failedGeneration : JSON.stringify(failedGeneration)).slice(0, 4000);
  let generated: unknown = failedGeneration;
  if (typeof generated === "string") {
    try {
      generated = JSON.parse(generated);
    } catch {
      return {
        raw,
        toolName: null,
        arguments: null,
        validationError: "Groq returned a failed_generation value that is not valid JSON, so no declared tool contract could validate it.",
        finalReportAsTool: false,
      };
    }
  }

  if (!generated || typeof generated !== "object" || Array.isArray(generated)) {
    return {
      raw,
      toolName: null,
      arguments: null,
      validationError: "Groq returned a failed_generation value that is not a tool-call object.",
      finalReportAsTool: false,
    };
  }

  const record = generated as Record<string, unknown>;
  const toolName = typeof record.name === "string" ? record.name : null;
  let generatedArguments = record.arguments ?? null;
  if (typeof generatedArguments === "string") {
    try {
      generatedArguments = JSON.parse(generatedArguments);
    } catch {
      return {
        raw,
        toolName,
        arguments: generatedArguments,
        validationError: `Arguments generated for ${toolName ?? "the unnamed tool"} are not valid JSON.`,
        finalReportAsTool: false,
      };
    }
  }

  if (!toolName) {
    return {
      raw,
      toolName: null,
      arguments: generatedArguments,
      validationError: "The generated tool call has no string name.",
      finalReportAsTool: false,
    };
  }

  if (!isToolName(toolName)) {
    const reportCandidate = finalReportSchema.safeParse(generatedArguments);
    const finalReportAsTool = toolName.toLowerCase() === "json" && reportCandidate.success;
    return {
      raw,
      toolName,
      arguments: generatedArguments,
      validationError: finalReportAsTool
        ? `Unknown tool '${toolName}'. Its arguments match the final-report schema and must be returned as assistant content, not as a tool call.`
        : `Unknown tool '${toolName}'. It is not one of the declared PayPart tools.`,
      finalReportAsTool,
    };
  }

  const parsedArguments = toolInputSchemas[toolName].safeParse(generatedArguments);
  return {
    raw,
    toolName,
    arguments: generatedArguments,
    validationError: parsedArguments.success
      ? `Groq rejected the generated ${toolName} call before execution even though its arguments match the local schema.`
      : `Arguments do not match the ${toolName} schema: ${formatZodIssues(parsedArguments.error)}`,
    finalReportAsTool: false,
  };
}

async function createCompletionWithContractRetry(
  investigation_id: string,
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[],
  forceContentOnly = false,
): Promise<ChatCompletion> {
  let contentOnly = forceContentOnly;

  for (let attempt = 1; attempt <= MAX_TOOL_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      return await getGroqClient().chat.completions.create({
        model: GROQ_MODEL,
        messages,
        ...(contentOnly
          ? {}
          : {
              tools,
              tool_choice: "auto" as const,
              parallel_tool_calls: false,
            }),
        temperature: attempt === 1 ? 0.1 : 0,
        reasoning_effort: "low",
        max_completion_tokens: 1400,
      });
    } catch (error) {
      const rejected = failedGenerationDetails(error);
      if (!rejected) throw error;

      const willRetry = attempt < MAX_TOOL_GENERATION_ATTEMPTS;
      const recoveryMode = rejected.finalReportAsTool ? "assistant_content_without_tools" : "correct_declared_tool_or_skip";

      await addInvestigationEvent({
        investigation_id,
        event_type: "model_tool_call_rejected",
        tool_name: rejected.toolName,
        input: toJson({
          attempt,
          generated_tool_name: rejected.toolName,
          generated_arguments: rejected.arguments,
        }),
        output: toJson({
          error: "Groq rejected a malformed generated tool call.",
          validation_error: rejected.validationError,
          failed_generation: rejected.raw,
          retrying: willRetry,
          recovery_mode: willRetry ? recoveryMode : "stop",
        }),
      });

      if (attempt === MAX_TOOL_GENERATION_ATTEMPTS) {
        throw new Error("Groq generated malformed tool calls twice. The investigation stopped instead of repeating invalid attempts.");
      }

      if (rejected.finalReportAsTool) {
        contentOnly = true;
        messages.push({
          role: "system",
          content:
            "Your report was incorrectly emitted as a tool call named JSON/json. Tools are disabled for this single correction. Return the final report as ordinary assistant content containing only the exact JSON object required by the system prompt.",
        });
      } else {
        messages.push({
          role: "system",
          content: `Your previous generated tool call was rejected: ${rejected.validationError} Correct it once. If the tool is not applicable because its source value is null or missing, skip it and finish or use other evidence; never invent an argument. JSON/json is not a tool.\n${TOOL_IDENTIFIER_RULES}`,
        });
      }
    }
  }

  throw new Error("Groq could not generate a valid tool call.");
}

export async function runInvestigation(
  userRequest: string,
  transactionReference?: string,
  onProgress?: ProgressHandler,
) {
  let investigation_id: string | undefined;

  try {
    const investigation = await createInvestigation(userRequest);
    investigation_id = investigation.id;
    await addInvestigationEvent({
      investigation_id: investigation.id,
      event_type: "investigation_started",
      input: toJson({ user_request: userRequest, transaction_reference: transactionReference || null }),
    });
    await onProgress?.({ type: "investigation_started", investigation_id: investigation.id });

    const context: ToolExecutionContext = {
      investigation_id: investigation.id,
      transaction_id: null,
      account_id: null,
      party_id: null,
      invoice_id: null,
      provider: null,
      provider_error_code: null,
      investigative_tool_calls: 0,
      action_request_ids: new Set(),
      unverified_action_request_ids: new Set(),
      invalid_tool_attempts: new Map(),
      blocked_tool_names: new Set(),
    };

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: transactionReference
          ? `${userRequest}\n\nTransaction reference supplied by the operator: ${transactionReference}`
          : userRequest,
      },
    ];

    let report: FinalReport | null = null;
    let finalAnswerOnly = false;

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
      await onProgress?.({ type: "thinking", iteration });

      const completion = await createCompletionWithContractRetry(
        investigation.id,
        messages,
        availableAgentTools(context.blocked_tool_names, {
          transactionLoaded: context.transaction_id !== null,
          invoice_id: context.invoice_id,
          provider_error_code: context.provider_error_code,
        }),
        finalAnswerOnly,
      );

      const message = completion.choices[0]?.message;
      if (!message) throw new Error("Groq returned no assistant message.");

      messages.push({
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      });

      if (message.tool_calls?.length) {
        finalAnswerOnly = false;
        for (const toolCall of message.tool_calls) {
          const result = await executeTool(
            context,
            toolCall.function.name,
            toolCall.function.arguments,
            onProgress,
          );
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      if (context.unverified_action_request_ids.size > 0) {
        finalAnswerOnly = false;
        messages.push({
          role: "user",
          content: `Before finishing, verify these action_request_id values with verify_action_request: ${Array.from(context.unverified_action_request_ids).join(", ")}`,
        });
        continue;
      }

      report = parseFinalReport(message.content);
      if (!report) {
        finalAnswerOnly = true;
        messages.push({
          role: "user",
          content: "Return the final answer now as valid JSON matching the exact schema in the system prompt. This correction runs without tools: return JSON as ordinary assistant content, not as a function call.",
        });
        continue;
      }

      break;
    }

    if (!report) {
      report = {
        summary: "The investigation stopped before a complete report could be produced.",
        diagnosis: "A reliable diagnosis is unavailable because the controlled agent reached its iteration limit.",
        recommendedAction: "Review the recorded timeline and continue the investigation with a human operator.",
        confidence: "low",
        actionTaken: "None",
      };
    }

    const actions = (
      await Promise.all(Array.from(context.action_request_ids).map((id) => getActionRequestById(id)))
    ).filter((action): action is ActionRequest => Boolean(action));

    await addInvestigationEvent({
      investigation_id: investigation.id,
      event_type: "diagnosis",
      output: toJson(report),
    });
    await updateInvestigation(investigation.id, {
      status: "completed",
      diagnosis: report.diagnosis,
      recommended_action: report.recommendedAction,
      completed_at: new Date().toISOString(),
    });
    await addInvestigationEvent({
      investigation_id: investigation.id,
      event_type: "investigation_completed",
      output: toJson({ report, action_ids: actions.map((action) => action.id) }),
    });

    const completed = { type: "completed" as const, investigation_id: investigation.id, report, actions };
    await onProgress?.(completed);
    return completed;
  } catch (error) {
    const errorMessage = safeErrorMessage(error);
    if (investigation_id) {
      try {
        await addInvestigationEvent({
          investigation_id,
          event_type: "investigation_failed",
          output: toJson({ error: errorMessage }),
        });
        await updateInvestigation(investigation_id, {
          status: "failed",
          diagnosis: "Investigation failed before a reliable diagnosis was produced.",
          recommended_action: "Review the error and retry the investigation; do not retry the payment.",
          completed_at: new Date().toISOString(),
        });
      } catch (persistenceError) {
        console.error("Could not persist failed investigation state", persistenceError);
      }
    }
    await onProgress?.({ type: "failed", investigation_id, error: errorMessage });
    throw error;
  }
}
