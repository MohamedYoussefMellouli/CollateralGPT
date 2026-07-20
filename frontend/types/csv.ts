// ─── Raw CSV row from vermeg.csv ─────────────────────────────────────────────

export interface CsvRow {
  SNAPSHOT_ID: string;
  DISPUTE_EVENT_ID: string;
  CALL_DATE: string;
  COUNTERPARTY_CODE: string;
  CURRENCY: string;
  AGREEMENT_DESC: string;
  THEIR_EXPOSURE: string;
  DISPUTE_AMOUNT: string;
  DISPUTE_AGE_DAYS: string;
  TOTAL_DISPUTE_AGE: string;
  CALL_STATUS_CODE: string;
  ORIGINAL_COMMENT: string;
  RECONCILIATION_COMMENT: string;
  REASON_CODE: string;
}

// ─── Parsed & categorised ────────────────────────────────────────────────────

export interface ParsedCsvResult {
  /** Rows with RECONCILIATION_COMMENT empty → to be analyzed */
  unresolved: CsvRow[];
  /** Rows with RECONCILIATION_COMMENT filled → used as history */
  resolved: CsvRow[];
  /** All rows in original order */
  allRows: CsvRow[];
  /** Total row count (excl. header) */
  total: number;
}

/**
 * Stores the AI result for a single resolved dispute.
 */
export interface ResolvedEntry {
  /** Cleaned suggested resolution text */
  resolution: string;
  /** Predicted reason code from the AI */
  reasonCode: string;
}

/**
 * Maps SNAPSHOT_ID → AI result (resolution + reason code).
 * Built progressively as the user analyzes disputes.
 */
export type ResolvedMap = Map<string, ResolvedEntry>;
