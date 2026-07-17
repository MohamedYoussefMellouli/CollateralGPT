"use client";

import { cn, getConfidenceBarColor, getConfidenceColor, getConfidenceLabel, formatScore } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";

interface ConfidenceBarProps {
  score: number; // 0–1
  className?: string;
  showLabel?: boolean;
}

export function ConfidenceBar({ score, className, showLabel = true }: ConfidenceBarProps) {
  const [displayed, setDisplayed] = useState(0);
  const pct = Math.round(score * 100);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const duration = 900; // ms

  useEffect(() => {
    startRef.current = null;

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * pct));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pct]);

  const barColor = getConfidenceBarColor(score);
  const textColor = getConfidenceColor(score);
  const label = getConfidenceLabel(score);

  return (
    <div className={cn("space-y-2", className)} role="region" aria-label={`Confidence score: ${formatScore(score)}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className={cn("w-4 h-4", textColor)} aria-hidden="true" />
            <span className="text-sm font-medium text-slate-300">Confidence Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                pct >= 95
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : pct >= 80
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : pct >= 60
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              )}
            >
              {label}
            </span>
            <span className={cn("text-xl font-bold tabular-nums", textColor)}>
              {displayed}%
            </span>
          </div>
        </div>
      )}

      {/* Track */}
      <div
        className="relative h-3 w-full rounded-full bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% confidence`}
      >
        {/* Glow overlay */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-none",
            barColor,
            "opacity-20 blur-sm"
          )}
          style={{ width: `${displayed}%` }}
          aria-hidden="true"
        />
        {/* Bar */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-none",
            barColor
          )}
          style={{ width: `${displayed}%` }}
        />
        {/* Shimmer */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"
          aria-hidden="true"
        />
      </div>

      {/* Scale markers */}
      <div className="flex justify-between text-[10px] text-slate-600 select-none" aria-hidden="true">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
