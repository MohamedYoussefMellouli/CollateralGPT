"use client";

import type { AnalysisResponse } from "@/types/dispute";
import { ConfidenceBar } from "./ConfidenceBar";
import {
  Brain,
  CheckCircle2,
  Calendar,
  Tag,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  response: AnalysisResponse;
  disputeId: string;
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

export function AnalysisCard({ response, disputeId }: AnalysisCardProps) {
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
    </section>
  );
}
