"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import type { CsvRow, ParsedCsvResult } from "@/types/csv";
import type { DisputeFormData } from "@/lib/validators";
import {
  Upload,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CsvUploaderProps {
  /** Called whenever the active unresolved dispute changes */
  onDisputeSelect: (values: Partial<DisputeFormData>, index: number, total: number) => void;
  /** Called when the user clears the uploaded file */
  onClear: () => void;
}

/** Normalise column names — strip spaces, uppercase */
function normalise(row: Record<string, string>): CsvRow {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim().toUpperCase().replace(/ /g, "_")] = (v ?? "").trim();
  }
  return out as unknown as CsvRow;
}

/** Map a CSV row to form values */
function rowToFormValues(row: CsvRow): Partial<DisputeFormData> {
  // Currency fallback: CSV currency column is often blank → default USD
  const currency = row.CURRENCY?.trim() || "USD";

  // Clamp currency to 3 chars
  const cur3 = currency.substring(0, 3).toUpperCase() || "USD";

  // Agreement type: truncate to 30 chars (Zod max)
  const agreementType = (row.AGREEMENT_DESC || "").substring(0, 30);

  // Dispute amount: parse float, fallback 0
  const disputeAmount = parseFloat(row.DISPUTE_AMOUNT) || 0;

  // Free text: prefer ORIGINAL_COMMENT, fall back to REASON_CODE description
  const comment =
    row.ORIGINAL_COMMENT?.trim() ||
    `Litige ${row.REASON_CODE || "inconnu"} — montant ${row.DISPUTE_AMOUNT} ${cur3}`;

  // Ensure comment meets Zod min(10)
  const safeComment = comment.length >= 10 ? comment : comment.padEnd(10, ".");

  // Parse date DD/MM/YYYY to YYYY-MM-DD for <input type="date">
  let callDate = "";
  if (row.CALL_DATE) {
    const parts = row.CALL_DATE.split("/");
    if (parts.length === 3) {
      callDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      callDate = row.CALL_DATE; // fallback if it's already yyyy-mm-dd
    }
  }

  return {
    dispute_id: row.SNAPSHOT_ID || "",
    counterparty_code: (row.COUNTERPARTY_CODE || "").substring(0, 20),
    agreement_type: agreementType || undefined,
    currency: cur3,
    dispute_amount: disputeAmount,
    free_text_comment: safeComment.substring(0, 1000),
    dispute_event_id: row.DISPUTE_EVENT_ID || "",
    call_date: callDate,
    their_exposure: parseFloat(row.THEIR_EXPOSURE) || 0,
    dispute_age_days: parseInt(row.DISPUTE_AGE_DAYS, 10) || 0,
    total_dispute_age: parseInt(row.TOTAL_DISPUTE_AGE, 10) || 0,
    call_status_code: row.CALL_STATUS_CODE || "",
  };
}

export function CsvUploader({ onDisputeSelect, onClear }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCsvResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      delimiter: ";",
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map(normalise);
        const isResolved = (c: string | undefined) => {
          if (!c) return false;
          const lower = c.trim().toLowerCase();
          return lower !== "" && lower !== "nan" && lower !== "null" && lower !== "none" && !lower.includes("zeineb");
        };

        const resolved = rows.filter((r) => isResolved(r.RECONCILIATION_COMMENT));
        const unresolved = rows.filter((r) => !isResolved(r.RECONCILIATION_COMMENT));
        const parsed: ParsedCsvResult = { unresolved, resolved, total: rows.length };
        setParsed(parsed);
        setActiveIndex(0);
        if (unresolved.length > 0) {
          onDisputeSelect(rowToFormValues(unresolved[0]), 0, unresolved.length);
        }
      },
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  };

  const navigate = (dir: -1 | 1) => {
    if (!parsed) return;
    const next = activeIndex + dir;
    if (next < 0 || next >= parsed.unresolved.length) return;
    setActiveIndex(next);
    onDisputeSelect(rowToFormValues(parsed.unresolved[next]), next, parsed.unresolved.length);
  };

  const clear = () => {
    setParsed(null);
    setActiveIndex(0);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    onClear();
  };

  // ── Not yet uploaded ─────────────────────────────────────────────────────
  if (!parsed) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group flex flex-col items-center justify-center gap-3 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700 hover:border-blue-500/60 hover:bg-slate-800/40"
        )}
        role="button"
        aria-label="Upload CSV file"
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          isDragging ? "bg-blue-500/20" : "bg-slate-800 group-hover:bg-blue-500/10"
        )}>
          <Upload className={cn("w-5 h-5 transition-colors", isDragging ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400")} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-300">
            Importer un fichier CSV
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Glisser-déposer ou cliquer • Séparateur <code className="text-slate-400">;</code>
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
          aria-label="CSV file input"
        />
      </div>
    );
  }

  // ── Loaded state ─────────────────────────────────────────────────────────
  const { unresolved, resolved, total } = parsed;
  const current = unresolved[activeIndex];

  return (
    <div className="space-y-3">
      {/* File info bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/60 rounded-lg">
        <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-xs text-slate-300 truncate flex-1 font-medium">{fileName}</span>
        <button
          onClick={clear}
          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
          aria-label="Remove CSV"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <span className="text-base font-bold text-white">{total}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">Total</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-red-500/5 rounded-lg border border-red-500/20">
          <span className="text-base font-bold text-red-400">{unresolved.length}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            <span className="text-[9px] text-red-400 uppercase tracking-wide">À traiter</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <span className="text-base font-bold text-emerald-400">{resolved.length}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 uppercase tracking-wide">Résolus</span>
          </div>
        </div>
      </div>

      {unresolved.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">Tous les litiges sont résolus !</p>
        </div>
      ) : (
        <>
          {/* Active dispute navigator */}
          <div className="flex items-center justify-between px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <button
              onClick={() => navigate(-1)}
              disabled={activeIndex === 0}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous dispute"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                Litige à traiter
              </p>
              <p className="text-xs font-bold text-white mt-0.5">
                {activeIndex + 1} / {unresolved.length}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                #{current?.SNAPSHOT_ID}
              </p>
            </div>

            <button
              onClick={() => navigate(1)}
              disabled={activeIndex === unresolved.length - 1}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next dispute"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Row metadata preview */}
          <div className="text-[10px] text-slate-500 space-y-0.5 px-1">
            <div className="flex justify-between">
              <span>Contrepartie</span>
              <span className="text-slate-400 font-medium">{current?.COUNTERPARTY_CODE}</span>
            </div>
            <div className="flex justify-between">
              <span>Accord</span>
              <span className="text-slate-400 font-medium truncate max-w-[60%] text-right">{current?.AGREEMENT_DESC}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant</span>
              <span className="text-amber-400 font-semibold">{Number(current?.DISPUTE_AMOUNT || 0).toLocaleString("fr-FR")} {current?.CURRENCY || "–"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Âge</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-2.5 h-2.5" />
                {current?.DISPUTE_AGE_DAYS} j
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
