import { z } from "zod";

// PostgreSQL's uuid type accepts the full 8-4-4-4-12 hexadecimal form without
// requiring RFC version/variant bits. z.guid() preserves that exact UUID shape.
const databaseId = (description: string) => z.guid().describe(description);
const title = z.string().trim().min(4).max(120).describe("Short operational action title.");
const description = z.string().trim().min(10).max(1200).describe("Evidence-based description for a human operator.");

export const toolInputSchemas = {
  get_transaction: z.strictObject({
    transaction_reference: z
      .string()
      .trim()
      .min(3)
      .max(80)
      .describe("The external transaction reference, for example PAY-1001. This is not a UUID."),
  }),
  get_account: z.strictObject({
    account_id: databaseId("The exact UUID from get_transaction result data.account_id. Never use transaction_reference or an account name."),
  }),
  get_party: z.strictObject({
    party_id: databaseId("The exact UUID from get_transaction result data.party_id. Never use transaction_reference or a party name."),
  }),
  get_invoice: z.strictObject({
    invoice_id: databaseId("The exact UUID from get_transaction result data.invoice_id. Call only when data.invoice_id is not null."),
  }),
  get_payment_attempts: z.strictObject({
    transaction_id: databaseId("The exact UUID from get_transaction result data.id. The property name is transaction_id, never transaction_uuid."),
  }),
  check_duplicate_transactions: z.strictObject({
    transaction_id: databaseId("The exact UUID from get_transaction result data.id. Do not use transaction_reference."),
  }),
  get_provider_error: z.strictObject({
    code: z.string().trim().min(2).max(100).describe("The exact non-null provider error code from get_transaction result data.provider_error_code. Do not call this tool when that field is null or missing."),
    provider: z.string().trim().min(2).max(100).describe("The exact provider name from get_transaction result data.provider."),
  }),
  create_support_ticket: z.strictObject({ title, description }),
  create_approval_request: z.strictObject({ title, description }),
  verify_action_request: z.strictObject({
    action_request_id: databaseId("The exact UUID from a create_support_ticket or create_approval_request result data.id."),
  }),
};

export type ToolName = keyof typeof toolInputSchemas;
export type ToolInputMap = {
  [Name in ToolName]: z.infer<(typeof toolInputSchemas)[Name]>;
};

export function isToolName(value: string): value is ToolName {
  return value in toolInputSchemas;
}

export const investigationRequestSchema = z.strictObject({
  request: z.string().trim().min(10).max(2000),
  transactionReference: z.string().trim().min(3).max(80).optional().or(z.literal("")),
});
