"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-800", className)}
      aria-hidden="true"
    />
  );
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading analysis results" aria-live="polite" aria-busy="true">
      {/* Summary skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="px-5 py-2 space-y-0">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
              <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-2 w-6" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Similar disputes skeleton */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
