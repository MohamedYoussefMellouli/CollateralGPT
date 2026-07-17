import { z } from "zod";

// ─── Schema for the analyst-facing form (5 editable fields + currency) ────────
// call_date, current_status_code, dispute_age_days, swift_narrative
// are all auto-computed and never appear in the form.

export const disputeSchema = z.object({
  dispute_id: z
    .string()
    .min(1, "Dispute ID is required")
    .max(50, "Must be 50 characters or less"),

  counterparty_code: z
    .string()
    .min(1, "Counterparty code is required")
    .max(20, "Must be 20 characters or less"),

  agreement_type: z
    .string()
    .min(1, "Agreement type is required")
    .max(30, "Must be 30 characters or less"),

  currency: z
    .string()
    .max(3, "Must be a 3-letter code")
    .optional()
    .or(z.literal("")),

  dispute_amount: z
    .number({ error: "Please enter a valid amount" })
    .min(0, "Amount must be 0 or greater"),

  free_text_comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment must be 1000 characters or less"),

  dispute_event_id: z.string().optional(),
  call_date: z.string().optional(),
  their_exposure: z.number().optional(),
  dispute_age_days: z.number().optional(),
  total_dispute_age: z.number().optional(),
  call_status_code: z.string().optional(),
});

export type DisputeFormData = z.infer<typeof disputeSchema>;
