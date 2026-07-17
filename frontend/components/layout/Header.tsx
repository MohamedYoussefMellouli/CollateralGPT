"use client";

import { Bell, Search, HelpCircle, Menu, Moon, Sun, Languages } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/components/Providers";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useTranslation();

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800"
      aria-label="Top navigation bar"
    >
      {/* Left: Mobile menu + title */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">
            {title || t("disputeAnalysis")}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {subtitle || t("aiPoweredResolution")}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="search"
            placeholder={t("searchDisputes")}
            className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-full"
            aria-label={t("searchDisputes")}
          />
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          aria-label={`Switch to ${language === "fr" ? "English" : "Français"}`}
          title={language === "fr" ? "English" : "Français"}
        >
          <Languages className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase">{language}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Help */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label={t("help")}
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label={t("notifications")}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500"
            aria-hidden="true"
          />
        </button>

        {/* Status badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-slate-400">{t("engineOnline")}</span>
        </div>
      </div>
    </header>
  );
}
