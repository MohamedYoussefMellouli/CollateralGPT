// ─── Dispute Input ───────────────────────────────────────────────────────────

export interface DisputeInput {
  dispute_id: string;
  counterparty_code: string;
  agreement_type: string;
  currency: string;
  their_exposure: number;
  dispute_amount: number;
  current_status_code: string;
  dispute_age_days: number;
  free_text_comment: string;
}

// ─── Similar Past Dispute ────────────────────────────────────────────────────

export interface SimilarDispute {
  id: string;
  score: number;
  resolution: string;
}

// ─── Analysis Response ───────────────────────────────────────────────────────

export interface AnalysisResponse {
  predicted_reason_code: string;
  confidence_score: number;
  suggested_resolution: string;
  estimated_resolution_days: number;
  similar_past_disputes: SimilarDispute[];
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
  status?: number;
}
