"use client";

import { FileQuestion, ArrowRight } from "lucide-react";
import { useTranslation } from "@/components/Providers";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const { t } = useTranslation();
  
  const displayTitle = title || t("noAnalysisYet");
  const displayDescription = description || t("fillDetailsPrompt");

  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8"
      aria-label="Empty state — no results to display"
      role="status"
    >
      {/* Icon glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150" aria-hidden="true" />
        <div className="relative w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-slate-500" aria-hidden="true" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-300 mb-2">{displayTitle}</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{displayDescription}</p>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold">
            1
          </span>
          <span>{t("fillForm")}</span>
        </div>
        <ArrowRight className="w-3 h-3 text-slate-700" aria-hidden="true" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold">
            2
          </span>
          <span>{t("analyze")}</span>
        </div>
        <ArrowRight className="w-3 h-3 text-slate-700" aria-hidden="true" />
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold">
            3
          </span>
          <span>{t("reviewResults")}</span>
        </div>
      </div>
    </div>
  );
}
