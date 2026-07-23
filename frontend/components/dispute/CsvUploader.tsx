"use client";

import { useRef, useState, useEffect } from "react";
import Papa from "papaparse";
import type { CsvRow, ParsedCsvResult, ResolvedMap } from "@/types/csv";
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
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CsvUploaderProps {
  /** Called whenever the active unresolved dispute changes */
  onDisputeSelect: (values: Partial<DisputeFormData>, index: number, total: number) => void;
  /** Called when the file is parsed — provides all rows to the parent */
  onAllRowsReady: (rows: CsvRow[]) => void;
  /** Called when the user clears the uploaded file */
  onClear: () => void;
  /** Map of SNAPSHOT_ID → AI resolution built by the parent as disputes are analyzed */
  resolvedMap: ResolvedMap;
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
  // Currency fallback: preserve original if blank
  const currency = row.CURRENCY?.trim() || "";

  // Clamp currency to 3 chars
  const cur3 = currency.substring(0, 3).toUpperCase() || "";

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

export function CsvUploader({ onDisputeSelect, onClear, onAllRowsReady, resolvedMap }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCsvResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Save current UI session stats to localStorage so the Chatbot can use them
  useEffect(() => {
    if (!parsed) return;
    const { unresolved, resolved, total } = parsed;
    const aiResolvedCount = resolvedMap.size;
    const actualUnresolvedCount = unresolved.filter(r => !resolvedMap.has(r.SNAPSHOT_ID)).length;
    const totalResolvedCount = resolved.length + aiResolvedCount;

    localStorage.setItem('cgpt_current_stats', JSON.stringify({
      total: total,
      resolved: totalResolvedCount,
      unresolved: actualUnresolvedCount
    }));
  }, [parsed, resolvedMap]);

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
        const parsed: ParsedCsvResult = { unresolved, resolved, allRows: rows, total: rows.length };
        setParsed(parsed);
        setActiveIndex(0);
        onAllRowsReady(rows);
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

  /**
   * Returns true if the comment is completely empty/missing in the original CSV.
   * These rows must stay blank in the downloaded CSV — no fallback text.
   */
  const isEmptyComment = (comment: string | undefined): boolean => {
    const c = (comment ?? "").trim().toLowerCase();
    return c === "" || c === "nan" || c === "null" || c === "none";
  };

  /**
   * Returns true if the comment is vague/polluted (new comment, zeineb, JSON dict...)
   * but NOT empty — these rows get the REASON_CODE standard resolution.
   */
  const isVagueComment = (comment: string): boolean => {
    const c = comment.trim().toLowerCase();
    // JSON dict output from LLM (starts with { or contains 'action':)
    const isJsonDict = c.startsWith("{") || c.includes("'action':");
    return (
      c.includes("new comment") ||
      c.includes("zeineb") ||
      isJsonDict
    );
  };

  /**
   * Cleans an AI result that may be a raw JSON dict string into a plain sentence.
   * e.g. "{'Action': 'Vérifier...', 'Source': '...'}" → "Vérifier..."
   */
  const cleanAiResolution = (resolution: string): string => {
    const trimmed = resolution.trim();
    // If it looks like a Python dict / JSON object, extract the Action value
    if (trimmed.startsWith("{")) {
      const match = trimmed.match(/['"]Action['"]\s*:\s*['"]([^'"]+)['"]/i);
      if (match) {
        const text = match[1].trim();
        return text.toLowerCase().startsWith("action") ? text : `Action : ${text}`;
      }
    }
    const cleaned = trimmed.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned.toLowerCase().startsWith("action") ? cleaned : `Action : ${cleaned}`;
  };

  /**
   * Resolution mapping by REASON_CODE — same as app.py.
   * Applied only when original comment is vague (not empty).
   */
  const REASON_CODE_RESOLUTIONS: Record<string, string> = {
    "MTM Difference":
      "Action : Vérifier le fixing Bloomberg J-1 et réconcilier avec le MTM contrepartie.",
    "IA Difference":
      "Action : Analyser l'écart d'intérêt (IA) ; comparer les courbes de taux.",
    "Collateral Balance Difference":
      "Action : Vérifier les transferts de titres en attente sur le compte collatéral.",
  };

  /**
   * Returns the best RECONCILIATION_COMMENT for a row:
   * 1. AI result from resolvedMap (user explicitly analyzed this dispute) — cleaned
   * 2. Empty original comment → keep EMPTY (do not fill with fallback text)
   * 3. Vague/polluted comment (zeineb, new comment, JSON…) → REASON_CODE standard resolution
   * 4. Valid original comment → keep as-is
   */
  const resolveComment = (row: CsvRow): string => {
    // Priority 1 — explicit AI analysis result (clean JSON dict if needed)
    const aiEntry = resolvedMap.get(row.SNAPSHOT_ID);
    if (aiEntry) return cleanAiResolution(aiEntry.resolution);

    const original = row.RECONCILIATION_COMMENT ?? "";

    // Priority 2 — truly empty → leave blank
    if (isEmptyComment(original)) return "";

    // Priority 3 — vague/polluted → replace with standard resolution
    if (isVagueComment(original)) {
      const rc = (row.REASON_CODE ?? "").trim();
      return REASON_CODE_RESOLUTIONS[rc] ?? "";
    }

    // Priority 4 — valid comment → always prepend "Action : "
    const cleaned = original.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    return `Action : ${cleaned}`;
  };

  /**
   * Infers REASON_CODE from the reconciliation comment when the original is empty.
   */
  const inferReasonCode = (comment: string, originalRc: string): string => {
    if (originalRc.trim()) return originalRc.trim();
    const c = comment.toLowerCase();
    if (c.includes("mtm") || c.includes("bloomberg") || c.includes("mark-to-market"))
      return "MTM Difference";
    if (c.includes("intérêt") || c.includes("interet") || c.includes(" ia ") || c.includes("taux"))
      return "IA Difference";
    if (c.includes("collatéral") || c.includes("collateral") || c.includes("titre") || c.includes("transfert"))
      return "Collateral Balance Difference";
    return originalRc;
  };

  /** Escapes a cell value for CSV: wraps in quotes if it contains ; " or newlines. */
  const escapeCsv = (value: string): string => {
    const str = String(value ?? "");
    if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  /** Download all rows from the original CSV with RECONCILIATION_COMMENT
   *  fully standardized: AI results + fallback resolution mapping for vague comments. */
  const handleDownloadAll = () => {
    if (!parsed) return;
    const headers: (keyof CsvRow)[] = [
      "SNAPSHOT_ID", "DISPUTE_EVENT_ID", "CALL_DATE", "COUNTERPARTY_CODE",
      "CURRENCY", "AGREEMENT_DESC", "THEIR_EXPOSURE", "DISPUTE_AMOUNT",
      "DISPUTE_AGE_DAYS", "TOTAL_DISPUTE_AGE", "CALL_STATUS_CODE",
      "ORIGINAL_COMMENT", "RECONCILIATION_COMMENT", "REASON_CODE",
    ];

    const rows = parsed.allRows.map((row) => {
      const resolvedComment = resolveComment(row);
      const resolvedRc = inferReasonCode(resolvedComment, row.REASON_CODE ?? "");
      const merged = {
        ...row,
        RECONCILIATION_COMMENT: resolvedComment,
        REASON_CODE: resolvedRc,
      };
      return headers.map((h) => escapeCsv(merged[h] ?? "")).join(";");
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + headers.join(";") + "\n" + rows.join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\.csv$/i, "")}_complet_resolu.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save to history in localStorage
    const historyKey = "cgpt_csv_history";
    const existing = JSON.parse(localStorage.getItem(historyKey) ?? "[]");
    const entry = {
      id: Date.now().toString(),
      fileName: `${fileName.replace(/\.csv$/i, "")}_complet_resolu.csv`,
      date: new Date().toISOString(),
      totalRows: parsed.allRows.length,
      aiResolved: resolvedMap.size,
      csvContent,
    };
    localStorage.setItem(historyKey, JSON.stringify([entry, ...existing].slice(0, 50)));
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
  const aiResolvedCount = resolvedMap.size;
  
  // Actually unresolved items are those from 'unresolved' that haven't been resolved by AI yet.
  const actualUnresolvedCount = unresolved.filter(r => !resolvedMap.has(r.SNAPSHOT_ID)).length;
  const totalResolvedCount = resolved.length + aiResolvedCount;



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
          <span className="text-base font-bold text-red-400">{actualUnresolvedCount}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            <span className="text-[9px] text-red-400 uppercase tracking-wide">À traiter</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <span className="text-base font-bold text-emerald-400">{resolved.length + aiResolvedCount}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 uppercase tracking-wide">Résolus</span>
          </div>
        </div>
      </div>

      {actualUnresolvedCount === 0 && unresolved.length > 0 ? (
        <>
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400">Tous les litiges sont résolus !</p>
          </div>
          {/* Active dispute navigator (still visible so they can review) */}
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
                Litige
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
        </>
      ) : unresolved.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">Aucun litige à traiter.</p>
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
                Litige en cours
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

      {/* ── Download full CSV button ───────────────────────────────────────── */}
      <button
        onClick={handleDownloadAll}
        disabled={aiResolvedCount === 0 && resolved.length === 0}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200
          bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500
          text-white border-blue-500/30 shadow-md shadow-blue-500/10
          hover:shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Télécharger le CSV complet avec les résolutions IA"
      >
        <FileDown className="w-3.5 h-3.5" />
        <span>Télécharger CSV complet</span>
        {aiResolvedCount > 0 && (
          <span className="ml-1 bg-blue-400/20 text-blue-200 text-[9px] px-1.5 py-0.5 rounded-full border border-blue-400/30">
            {aiResolvedCount} IA
          </span>
        )}
      </button>
    </div>
  );
}
