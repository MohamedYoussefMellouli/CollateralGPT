import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function getConfidenceColor(score: number): string {
  const pct = score * 100;
  if (pct >= 95) return "text-emerald-400";
  if (pct >= 80) return "text-blue-400";
  if (pct >= 60) return "text-amber-400";
  return "text-red-400";
}

export function getConfidenceBarColor(score: number): string {
  const pct = score * 100;
  if (pct >= 95) return "bg-emerald-500";
  if (pct >= 80) return "bg-blue-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function getConfidenceLabel(score: number): string {
  const pct = score * 100;
  if (pct >= 95) return "Very High";
  if (pct >= 80) return "High";
  if (pct >= 60) return "Moderate";
  return "Low";
}
