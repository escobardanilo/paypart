import { z } from "zod";

export const PINY_REQUEST_TYPES = [
  "Supplier invoice",
  "Software subscription",
  "Customer refund",
  "Contractor payment",
  "Expense reimbursement",
] as const;

export const pinyDraftSchema = z.object({
  requestType: z.enum(PINY_REQUEST_TYPES).nullable(),
  counterparty: z.string().trim().min(1).max(180).nullable(),
  amount: z.number().positive().finite().nullable(),
  currency: z.enum(["EUR", "GBP", "USD"]).nullable(),
  description: z.string().trim().min(1).max(600).nullable(),
  dueDate: z.string().trim().min(1).max(80).nullable(),
  reference: z.string().trim().min(1).max(120).nullable(),
  missingFields: z.array(z.string().trim().min(1).max(80)).max(7),
}).strict();

export const pinyResponseSchema = z.object({
  intent: z.enum(["workspace_answer", "request_draft", "refusal", "insufficient_information"]),
  message: z.string().trim().min(1).max(4000),
  draft: pinyDraftSchema.nullable(),
}).strict();

export const pinyInputSchema = z.object({
  message: z.string().trim().max(4000),
  consent: z.literal("true"),
});

export type PinyDraft = z.infer<typeof pinyDraftSchema>;
export type PinyResponse = z.infer<typeof pinyResponseSchema>;

export const PINY_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "message", "draft"],
  properties: {
    intent: {
      type: "string",
      enum: ["workspace_answer", "request_draft", "refusal", "insufficient_information"],
    },
    message: { type: "string" },
    draft: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["requestType", "counterparty", "amount", "currency", "description", "dueDate", "reference", "missingFields"],
          properties: {
            requestType: { type: ["string", "null"], enum: [...PINY_REQUEST_TYPES, null] },
            counterparty: { type: ["string", "null"] },
            amount: { type: ["number", "null"] },
            currency: { type: ["string", "null"], enum: ["EUR", "GBP", "USD", null] },
            description: { type: ["string", "null"] },
            dueDate: { type: ["string", "null"] },
            reference: { type: ["string", "null"] },
            missingFields: { type: "array", items: { type: "string" } },
          },
        },
      ],
    },
  },
} as const;

export function normalizePinyDraft(draft: PinyDraft): PinyDraft {
  const fields: Array<[string, string | number | null]> = [
    ["Request type", draft.requestType],
    ["Counterparty", draft.counterparty],
    ["Amount", draft.amount],
    ["Currency", draft.currency],
    ["Purpose", draft.description],
    ["Due date", draft.dueDate],
    ["Invoice reference", draft.reference],
  ];

  return {
    ...draft,
    missingFields: fields.filter(([, value]) => value === null).map(([label]) => label),
  };
}
