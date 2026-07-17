import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string): string {
  // Valider et nettoyer le code de devise
  const cleanCurrency = currency?.trim().toUpperCase();
  
  // Liste des devises ISO 4217 communes
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'BRL'];
  
  // Si pas de devise ou devise invalide, utiliser USD par défaut
  const safeCurrency = cleanCurrency && validCurrencies.includes(cleanCurrency) ? cleanCurrency : 'USD';
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback en cas d'erreur : formatage simple avec symbole $
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
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
