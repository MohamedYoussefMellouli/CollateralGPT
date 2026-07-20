"use client";

import type { AnalysisResponse } from "@/types/dispute";
import type { DisputeFormData } from "@/lib/validators";
import { ConfidenceBar } from "./ConfidenceBar";
import {
  Brain,
  CheckCircle2,
  Calendar,
  Tag,
  Lightbulb,
  Sparkles,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  response: AnalysisResponse;
  disputeId: string;
  formData: DisputeFormData | null;
}

function SectionTitle({
  icon: Icon,
  title,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn("w-4 h-4", iconClass ?? "text-slate-400")} aria-hidden="true" />
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
    </div>
  );
}

/** Escape a CSV field value (handle semicolons, quotes, newlines) */
function escapeCsvField(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Strip Python-dict / JSON formatting from AI resolution strings.
 * Converts:  {'Action': 'Vérifier...', 'Justification': '...'}
 * Into:      Action : Vérifier... | Justification : ...
 */
function cleanResolution(raw: string): string {
  const trimmed = raw.trim();

  // Detect a dict-like string: starts with { and ends with }
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      // Try JSON parse first (double-quoted keys)
      const parsed = JSON.parse(trimmed) as Record<string, string>;
      return Object.entries(parsed)
        .map(([k, v]) => `${k} : ${v}`)
        .join(" | ");
    } catch {
      // Fallback: strip braces/quotes and format as plain text
      return trimmed
        .slice(1, -1)                                 // remove { }
        .replace(/'([^']+)'\s*:\s*'([^']*)'/g, "$1 : $2")  // 'Key': 'Value'
        .replace(/,\s*/g, " | ")                      // commas → pipe
        .trim();
    }
  }

  return trimmed;
}

export function AnalysisCard({ response, disputeId, formData }: AnalysisCardProps) {

  const handleDownloadCsv = () => {
    // CSV column headers matching vermeg.csv
    const headers = [
      "SNAPSHOT_ID",
      "DISPUTE_EVENT_ID",
      "CALL_DATE",
      "COUNTERPARTY_CODE",
      "CURRENCY",
      "AGREEMENT_DESC",
      "THEIR_EXPOSURE",
      "DISPUTE_AMOUNT",
      "DISPUTE_AGE_DAYS",
      "TOTAL_DISPUTE_AGE",
      "CALL_STATUS_CODE",
      "ORIGINAL_COMMENT",
      "RECONCILIATION_COMMENT",
      "REASON_CODE",
    ];

    // Convert call_date from YYYY-MM-DD back to DD/MM/YYYY for CSV compatibility
    let callDateCsv = "";
    if (formData?.call_date) {
      const parts = formData.call_date.split("-");
      if (parts.length === 3) {
        callDateCsv = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        callDateCsv = formData.call_date;
      }
    }

    // Build the row values from formData + AI predictions
    const rowValues = [
      formData?.dispute_id || "",
      formData?.dispute_event_id || "0",
      callDateCsv,
      formData?.counterparty_code || "",
      formData?.currency || "",
      formData?.agreement_type || "",
      String(formData?.their_exposure ?? 0),
      String(formData?.dispute_amount ?? 0),
      String(formData?.dispute_age_days ?? 0),
      String(formData?.total_dispute_age ?? 0),
      formData?.call_status_code || "",
      formData?.free_text_comment || "",
      cleanResolution(response.suggested_resolution).replace(/[\r\n]+/g, " "),
      response.predicted_reason_code,
    ];

    // Build CSV content with semicolon separator (matching vermeg.csv format)
    const csvContent =
      headers.join(";") + "\n" +
      rowValues.map((v) => escapeCsvField(String(v))).join(";") + "\n";

    // Trigger browser download
    // Prepend UTF-8 BOM (\uFEFF) so Excel opens accented characters correctly
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dispute_${formData?.dispute_id || "export"}_resolved.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="space-y-4"
      aria-label="Analysis results"
    >
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-950/40 to-indigo-950/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Analysis Results</h2>
            <p className="text-[10px] text-blue-400/70">Case #{disputeId}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs text-amber-400 font-medium">Powered by Mistral</span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Predicted Reason Code */}
          <div>
            <SectionTitle icon={Tag} title="Predicted Reason Code" iconClass="text-blue-400" />
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-bold px-4 py-2 rounded-xl"
                aria-label={`Predicted reason code: ${response.predicted_reason_code}`}
              >
                <CheckCircle2 className="w-4 h-4 text-blue-400" aria-hidden="true" />
                {response.predicted_reason_code}
              </span>
            </div>
          </div>

          {/* Confidence Score */}
          <div>
            <SectionTitle icon={Brain} title="Model Confidence" iconClass="text-purple-400" />
            <ConfidenceBar score={response.confidence_score} />
          </div>

          {/* Estimated Resolution */}
          <div>
            <SectionTitle icon={Calendar} title="Estimated Resolution Time" iconClass="text-emerald-400" />
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
              <Calendar className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xl font-bold text-emerald-400 leading-none">
                  {response.estimated_resolution_days}
                  <span className="text-sm font-normal text-emerald-400/70 ml-1">days</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Expected resolution window</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Resolution */}
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
        aria-label="Suggested resolution"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-amber-950/20">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <Lightbulb className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold text-white">Suggested Resolution</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            {response.suggested_resolution}
          </p>
        </div>
      </div>

      {/* Download CSV Button */}
      {formData && (
        <button
          onClick={handleDownloadCsv}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-200 group"
          aria-label="Download resolved dispute as CSV"
        >
          <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Télécharger le CSV résolu</span>
        </button>
      )}
    </section>
  );
}

