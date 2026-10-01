"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  Zap,
  ArrowRight,
  CheckCircle2,
  Globe,
} from "lucide-react";

const i18n = {
  fr: {
    badge:        "Propulsé par Mistral 7B & RAG",
    hero:         "Analysez vos litiges collatéraux avec l'IA",
    heroSub:      "CollateralGPT automatise la détection, l'analyse et la recommandation de résolution des litiges financiers — en temps réel.",
    ctaLogin:     "Se connecter",
    ctaRegister:  "Créer un compte",
    featuresTitle:"Fonctionnalités clés",
    features: [
      {
        icon: Brain,
        color: "text-blue-400",
        bg:    "bg-blue-500/10 border-blue-500/20",
        title: "Analyse RAG",
        desc:  "Recherche sémantique dans l'historique des litiges via ChromaDB et embeddings HuggingFace.",
      },
      {
        icon: BarChart3,
        color: "text-emerald-400",
        bg:    "bg-emerald-500/10 border-emerald-500/20",
        title: "Statistiques en direct",
        desc:  "Taux de résolution, montants, codes de litige — calculés directement depuis le CSV source.",
      },
      {
        icon: MessageSquare,
        color: "text-purple-400",
        bg:    "bg-purple-500/10 border-purple-500/20",
        title: "Chat intelligent",
        desc:  "Posez vos questions en français ou en anglais. Le moteur détecte le type de question et adapte sa réponse.",
      },
      {
        icon: ShieldCheck,
        color: "text-amber-400",
        bg:    "bg-amber-500/10 border-amber-500/20",
        title: "Authentification sécurisée",
        desc:  "JWT + bcrypt. Chaque session est isolée et protégée par token d'accès.",
      },
      {
        icon: Zap,
        color: "text-rose-400",
        bg:    "bg-rose-500/10 border-rose-500/20",
        title: "Import CSV",
        desc:  "Chargez un fichier de litiges et naviguez cas par cas avec export des résolutions générées.",
      },
      {
        icon: Globe,
        color: "text-sky-400",
        bg:    "bg-sky-500/10 border-sky-500/20",
        title: "Bilingue FR / EN",
        desc:  "Interface et réponses IA disponibles en français et en anglais, avec détection automatique.",
      },
    ],
    statsTitle: "Chiffres clés",
    stats: [
      { value: "24",    label: "Litiges indexés" },
      { value: "94.2%", label: "Précision moyenne" },
      { value: "~8s",   label: "Temps de réponse" },
      { value: "3",     label: "Codes de litige" },
    ],
    whyTitle: "Pourquoi CollateralGPT ?",
    why: [
      "Réduction du temps de traitement des litiges",
      "Recommandations basées sur des cas réels",
      "Aucune hallucination — réponses ancrées dans les données",
      "Compatible accords ISDA / CSA / Repo",
    ],
    footer: "Développé lors d'un stage chez Vermeg",
  },
  en: {
    badge:        "Powered by Mistral 7B & RAG",
    hero:         "Analyze your collateral disputes with AI",
    heroSub:      "CollateralGPT automates detection, analysis, and resolution recommendations for financial disputes — in real time.",
    ctaLogin:     "Sign in",
    ctaRegister:  "Create an account",
    featuresTitle:"Key features",
    features: [
      {
        icon: Brain,
        color: "text-blue-400",
        bg:    "bg-blue-500/10 border-blue-500/20",
        title: "RAG Analysis",
        desc:  "Semantic search across dispute history via ChromaDB and HuggingFace embeddings.",
      },
      {
        icon: BarChart3,
        color: "text-emerald-400",
        bg:    "bg-emerald-500/10 border-emerald-500/20",
        title: "Live Statistics",
        desc:  "Resolution rates, amounts, dispute codes — computed directly from the source CSV.",
      },
      {
        icon: MessageSquare,
        color: "text-purple-400",
        bg:    "bg-purple-500/10 border-purple-500/20",
        title: "Smart Chat",
        desc:  "Ask questions in French or English. The engine detects question type and adapts its answer.",
      },
      {
        icon: ShieldCheck,
        color: "text-amber-400",
        bg:    "bg-amber-500/10 border-amber-500/20",
        title: "Secure Auth",
        desc:  "JWT + bcrypt. Every session is isolated and protected by access token.",
      },
      {
        icon: Zap,
        color: "text-rose-400",
        bg:    "bg-rose-500/10 border-rose-500/20",
        title: "CSV Import",
        desc:  "Load a dispute file and navigate case by case with export of AI-generated resolutions.",
      },
      {
        icon: Globe,
        color: "text-sky-400",
        bg:    "bg-sky-500/10 border-sky-500/20",
        title: "Bilingual FR / EN",
        desc:  "UI and AI responses available in French and English with automatic detection.",
      },
    ],
    statsTitle: "Key numbers",
    stats: [
      { value: "24",    label: "Indexed disputes" },
      { value: "94.2%", label: "Average accuracy" },
      { value: "~8s",   label: "Response time" },
      { value: "3",     label: "Dispute codes" },
    ],
    whyTitle: "Why CollateralGPT?",
    why: [
      "Reduced dispute processing time",
      "Recommendations based on real cases",
      "No hallucination — answers grounded in data",
      "Compatible with ISDA / CSA / Repo agreements",
    ],
    footer: "Developed during an internship at Vermeg",
  },
};

export default function HomePage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = i18n[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="CollateralGPT" className="h-9 w-auto object-contain" />
          <div>
            <p className="text-sm font-bold text-white leading-none">CollateralGPT</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Decision Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* FR / EN toggle */}
          <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  lang === l ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
          >
            {t.ctaLogin}
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
          >
            {t.ctaRegister}
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-6">
          <Zap className="w-3 h-3" />
          {t.badge}
        </span>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white max-w-2xl leading-tight mb-5">
          {t.hero}
        </h1>
        <p className="text-base text-slate-400 max-w-xl mb-8 leading-relaxed">
          {t.heroSub}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-xl shadow-blue-500/20"
          >
            {t.ctaRegister}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
          >
            {t.ctaLogin}
          </Link>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {t.stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl py-6 px-4">
              <span className="text-3xl font-extrabold text-white mb-1">{value}</span>
              <span className="text-xs text-slate-500 text-center">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-white text-center mb-8">{t.featuresTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.features.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-colors">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why ────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-lg font-bold text-white mb-5 text-center">{t.whyTitle}</h2>
          <ul className="space-y-3">
            {t.why.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              {t.ctaRegister}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-6 text-center">
        <p className="text-xs text-slate-600">
          CollateralGPT © {new Date().getFullYear()} — {t.footer}
        </p>
      </footer>
    </div>
  );
}
