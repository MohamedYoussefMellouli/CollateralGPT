"use client";

import { useState, useRef } from "react";
import { DisputeForm } from "@/components/dispute/DisputeForm";
import { CsvUploader } from "@/components/dispute/CsvUploader";
import { SummaryCard } from "@/components/dispute/SummaryCard";
import { AnalysisCard } from "@/components/dispute/AnalysisCard";
import { SimilarDisputes } from "@/components/dispute/SimilarDisputes";
import { ResultsSkeleton } from "@/components/dispute/ResultsSkeleton";
import { EmptyState } from "@/components/dispute/EmptyState";
import type { AnalysisResponse, DisputeInput } from "@/types/dispute";
import type { DisputeFormData } from "@/lib/validators";
import type { CsvRow, ResolvedMap, ResolvedEntry } from "@/types/csv";
import { Zap, Shield, TrendingUp, Clock, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "@/components/Providers";

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const { t } = useTranslation();
  
  const stats = [
    { label: t("model"),        value: "Mistral 7B", icon: Zap,        color: "text-amber-400"  },
    { label: t("engine"),       value: t("online"),     icon: Shield,      color: "text-emerald-400"},
    { label: t("avgAccuracy"),value: "94.2%",      icon: TrendingUp,  color: "text-blue-400"  },
    { label: t("avgResponse"),value: "~8s",         icon: Clock,       color: "text-purple-400"},
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" aria-label="Dashboard statistics">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{label}</p>
            <p className={`text-sm font-bold ${color} leading-tight`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();
  const [result,         setResult]         = useState<AnalysisResponse | null>(null);
  const [submittedInput, setSubmittedInput]  = useState<DisputeInput | null>(null);
  const [submittedFormData, setSubmittedFormData] = useState<DisputeFormData | null>(null);
  const [isPending,      setIsPending]       = useState(false);
  const [prefillValues,  setPrefillValues]   = useState<Partial<DisputeFormData> | undefined>();
  const [csvInfo,        setCsvInfo]         = useState<{ current: number; total: number } | null>(null);

  // Tracks AI resolutions by SNAPSHOT_ID for the bulk CSV export
  const resolvedMapRef = useRef<ResolvedMap>(new Map());
  const [resolvedMap,   setResolvedMap]      = useState<ResolvedMap>(new Map());

  const handleResult = (input: DisputeInput, response: AnalysisResponse, formData: DisputeFormData) => {
    setSubmittedInput(input);
    setResult(response);
    setSubmittedFormData(formData);
    setIsPending(false);

    // Register this resolution in the map so the bulk export can use it
    if (formData.dispute_id) {
      const entry: ResolvedEntry = {
        resolution: response.suggested_resolution.trim().replace(/[\r\n]+/g, " "),
        reasonCode: response.predicted_reason_code,
      };
      resolvedMapRef.current.set(formData.dispute_id, entry);
      // Trigger re-render by spreading into a new Map
      setResolvedMap(new Map(resolvedMapRef.current));
    }
  };

  const handlePending = (pending: boolean) => {
    setIsPending(pending);
    if (pending) setResult(null);
  };

  const handleDisputeSelect = (
    values: Partial<DisputeFormData>,
    index: number,
    total: number
  ) => {
    setPrefillValues(values);
    setCsvInfo({ current: index + 1, total });
    // Clear previous analysis result when navigating to a new dispute
    setResult(null);
    setSubmittedInput(null);
    setSubmittedFormData(null);
  };

  const handleClearCsv = () => {
    setPrefillValues(undefined);
    setCsvInfo(null);
    setResult(null);
    setSubmittedInput(null);
    setSubmittedFormData(null);
    // Reset the resolved map when a new file is loaded
    resolvedMapRef.current = new Map();
    setResolvedMap(new Map());
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAllRowsReady = (_rows: CsvRow[]) => {
    // Reset map whenever a new file is imported
    resolvedMapRef.current = new Map();
    setResolvedMap(new Map());
  };

  return (
    <div className="space-y-6">
      <StatsBar />

      <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6 items-start">

        {/* ── Left column ───────────────────────────────────────────── */}
        <aside aria-label="Dispute input form">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden sticky top-24 space-y-0">

            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/30">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  {csvInfo
                    ? t("disputeNumber").replace("{{current}}", String(csvInfo.current)).replace("{{total}}", String(csvInfo.total))
                    : t("newDispute")}
                </h2>
                <p className="text-[10px] text-slate-500">
                  {csvInfo ? t("loadedFromCSV") : t("manualOrImport")}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {csvInfo && (
                  <span className="text-[10px] font-medium text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FileSpreadsheet className="w-2.5 h-2.5" />
                    {t("csvBadge")}
                  </span>
                )}
                <span className="text-[10px] font-medium text-blue-400/70 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {t("required")} *
                </span>
              </div>
            </div>

            {/* CSV Uploader section */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-800/60">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-3 h-3" />
                {t("importCSVSection")}
                <span className="flex-1 h-px bg-slate-800" />
              </p>
              <CsvUploader
                onDisputeSelect={handleDisputeSelect}
                onClear={handleClearCsv}
                onAllRowsReady={handleAllRowsReady}
                resolvedMap={resolvedMap}
              />
            </div>

            {/* Form body */}
            <div className="px-5 pb-5 pt-4">
              <DisputeForm
                onResult={handleResult}
                onPendingChange={handlePending}
                prefillValues={prefillValues}
              />
            </div>
          </div>
        </aside>

        {/* ── Right column: Results ─────────────────────────────────── */}
        <section aria-label="Analysis results" aria-live="polite" className="min-h-[500px]">
          {isPending ? (
            <ResultsSkeleton />
          ) : result && submittedInput ? (
            <div className="space-y-4">
              <div className="animate-fade-in-up">
                <SummaryCard input={submittedInput} />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
              <AnalysisCard response={result} disputeId={submittedInput.dispute_id} formData={submittedFormData} />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                <SimilarDisputes disputes={result.similar_past_disputes} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl h-full">
              <EmptyState />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
