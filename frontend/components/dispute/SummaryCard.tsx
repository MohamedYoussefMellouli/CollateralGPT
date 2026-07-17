"use client";

import type { DisputeInput } from "@/types/dispute";
import {
  Building2,
  Globe,
  Landmark,
  DollarSign,
  FileText,
  MessageSquare,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/components/Providers";

interface SummaryCardProps {
  input: DisputeInput;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass = "text-slate-200",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export function SummaryCard({ input }: SummaryCardProps) {
  const { t } = useTranslation();
  
  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
      aria-label="Dispute summary"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/30">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <FileText className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{t("disputeOverview")}</h2>
          <p className="text-[10px] text-slate-500">{t("inputDataOverview")}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-mono bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded-md">
            #{input.dispute_id}
          </span>
        </div>
      </div>

      {/* Analyst-facing fields */}
      <div className="px-5 py-1">
        <InfoRow icon={Building2} label={t("counterparty")} value={input.counterparty_code} />
        <InfoRow icon={Landmark} label={t("agreementType")} value={input.agreement_type} />
        <InfoRow icon={Globe} label={t("currency")} value={input.currency} />
        <InfoRow
          icon={DollarSign}
          label={t("disputeAmount")}
          value={formatCurrency(input.dispute_amount, input.currency)}
          valueClass="text-amber-300"
        />
      </div>

      {/* Comment */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MessageSquare className="w-3 h-3 text-slate-500" aria-hidden="true" />
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {t("analystComment")}
          </p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-800">
          {input.free_text_comment}
        </p>
      </div>

      {/* Auto-filled metadata footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <span>{t("status")}: <span className="text-slate-500 font-semibold">{t("statusOpen")}</span></span>
          <span>{t("age")}: <span className="text-slate-500 font-semibold">0 {t("days")}</span></span>
          <span>SWIFT: <span className="italic text-slate-600">{t("autoRetrieved")}</span></span>
        </div>
      </div>
    </section>
  );
}
