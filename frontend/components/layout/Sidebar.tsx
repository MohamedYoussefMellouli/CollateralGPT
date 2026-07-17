"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileSearch,
  History,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/Providers";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    {
      label: t("dashboard"),
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: t("analyzeDispute"),
      href: "/",
      icon: FileSearch,
      active: true,
    },
    {
      label: t("history"),
      href: "#",
      icon: History,
      disabled: true,
    },
    {
      label: t("analytics"),
      href: "#",
      icon: BarChart3,
      disabled: true,
    },
    {
      label: t("settings"),
      href: "#",
      icon: Settings,
      disabled: true,
    },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-950 border-r border-slate-800 fixed left-0 top-0 z-30"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight leading-none">
            CollateralGPT
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">
            Decision Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Sidebar navigation">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {t("menu")}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            !item.disabled && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              aria-disabled={item.disabled}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : item.disabled
                  ? "text-slate-600 cursor-not-allowed"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
              )}
              tabIndex={item.disabled ? -1 : 0}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-blue-400/60" />
              )}
              {item.disabled && (
                <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                  {t("soon")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            AI
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{t("aiAnalyst")}</p>
            <p className="text-[10px] text-slate-500 truncate">{t("poweredBy")}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" aria-label="Online" />
        </div>
      </div>
    </aside>
  );
}
