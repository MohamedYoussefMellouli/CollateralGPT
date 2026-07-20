"use client";

import { useEffect, useState } from "react";
import { History, FileDown, Trash2, FolderOpen, Calendar, Rows3, Bot } from "lucide-react";
import { useTranslation } from "@/components/Providers";

interface HistoryEntry {
  id: string;
  fileName: string;
  date: string;
  totalRows: number;
  aiResolved: number;
  csvContent: string;
}

const HISTORY_KEY = "cgpt_csv_history";

export default function HistoryPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) setEntries(JSON.parse(raw));
  }, []);

  const handleDownload = (entry: HistoryEntry) => {
    const blob = new Blob([entry.csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = entry.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleClear = () => {
    setEntries([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <History className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t("historyTitle")}</h1>
            <p className="text-xs text-slate-500">{t("historySubtitle")}</p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("historyClear")}
          </button>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <FolderOpen className="w-7 h-7 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-400">{t("historyEmpty")}</p>
            <p className="text-xs text-slate-600 mt-1">{t("historyEmptyHint")}</p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_140px_80px_80px_100px] gap-4 px-5 py-3 border-b border-slate-800 bg-slate-800/30">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileDown className="w-3 h-3" />{t("historyFile")}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />{t("historyDate")}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Rows3 className="w-3 h-3" />{t("historyRows")}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-3 h-3" />{t("historyResolved")}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">
              Actions
            </span>
          </div>

          {/* Rows */}
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`grid grid-cols-[1fr_140px_80px_80px_100px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-slate-800/30 ${
                i < entries.length - 1 ? "border-b border-slate-800/60" : ""
              }`}
            >
              {/* File name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FileDown className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-slate-200 truncate">{entry.fileName}</span>
              </div>

              {/* Date */}
              <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>

              {/* Total rows */}
              <span className="text-xs font-semibold text-white">{entry.totalRows}</span>

              {/* AI resolved */}
              <span className="text-xs font-semibold text-emerald-400">{entry.aiResolved}</span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleDownload(entry)}
                  title={t("historyDownload")}
                  className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  title={t("historyDelete")}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
