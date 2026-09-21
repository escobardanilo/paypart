import { z } from "zod";
import type { Json } from "@/lib/database/types";

export interface ControlledTool<Input, Output> {
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  execute: (input: Input) => Promise<Output>;
}

export interface ControlledToolResult<Output> {
  ok: boolean;
  output?: Output;
  error?: {
    code: "invalid_arguments" | "execution_failed";
    message: string;
    details?: Json;
  };
}

export async function executeControlledTool<Input, Output>(
  tool: ControlledTool<Input, Output>,
  input: unknown,
): Promise<ControlledToolResult<Output>> {
  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid_arguments",
        message: "Tool arguments did not match the controlled contract.",
        details: JSON.parse(JSON.stringify(parsed.error.flatten())) as Json,
      },
    };
  }

  try {
    return { ok: true, output: await tool.execute(parsed.data) };
  } catch {
    return {
      ok: false,
      error: {
        code: "execution_failed",
        message: "The controlled operation could not be completed.",
      },
    };
  }
}
