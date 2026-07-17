"use client";

import type { SimilarDispute } from "@/types/dispute";
import { formatScore, cn } from "@/lib/utils";
import { History, ArrowUpDown, ExternalLink } from "lucide-react";

interface SimilarDisputesProps {
  disputes: SimilarDispute[];
}

function ScoreBadge({ score }: { score: number }) {
  const pct = score * 100;
  const colorClass =
    pct >= 90
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
      : pct >= 75
      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
      : pct >= 60
      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
      : "bg-slate-700/50 border-slate-600 text-slate-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
        colorClass
      )}
      aria-label={`Similarity score: ${formatScore(score)}`}
    >
      {formatScore(score)}
    </span>
  );
}

export function SimilarDisputes({ disputes }: SimilarDisputesProps) {
  // Sort descending by score
  const sorted = [...disputes].sort((a, b) => b.score - a.score);

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
      aria-label="Similar past disputes"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <History className="w-4 h-4 text-purple-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Similar Past Disputes</h2>
            <p className="text-[10px] text-slate-500">
              {sorted.length} case{sorted.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
          <span>Score ↓</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <History className="w-10 h-10 text-slate-700 mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">No similar cases found</p>
          <p className="text-xs text-slate-600 mt-1">
            This may be a novel dispute type.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Similar past disputes table">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th
                  scope="col"
                  className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3"
                >
                  Case ID
                </th>
                <th
                  scope="col"
                  className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3"
                >
                  Similarity
                </th>
                <th
                  scope="col"
                  className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3"
                >
                  Suggested Resolution
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((dispute, idx) => (
                <tr
                  key={dispute.id}
                  className={cn(
                    "group transition-colors hover:bg-slate-800/40 border-b border-slate-800/50 last:border-0",
                    idx === 0 && "bg-blue-500/5"
                  )}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                          aria-label="Best match"
                        />
                      )}
                      <span className="text-xs font-mono font-medium text-slate-300">
                        {dispute.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <ScoreBadge score={dispute.score} />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-slate-400 max-w-xs line-clamp-2 leading-relaxed">
                      {dispute.resolution}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
