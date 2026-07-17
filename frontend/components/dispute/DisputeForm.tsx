"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { disputeSchema, type DisputeFormData } from "@/lib/validators";
import { useAnalyzeDispute } from "@/hooks/useAnalyzeDispute";
import type { AnalysisResponse, DisputeInput } from "@/types/dispute";
import {
  Send,
  Loader2,
  AlertCircle,
  Hash,
  Building2,
  FileText,
  Globe,
  DollarSign,
  MessageSquare,
  RefreshCw,
  Zap,
  Calendar,
  Clock,
  Activity,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Auto-computed preview badge ─────────────────────────────────────────────

function AutoFilledBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
        {value}
      </span>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  icon: React.ElementType;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, icon: Icon, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <Icon className="w-3 h-3 text-slate-500" aria-hidden="true" />
        {label}
        {required && <span className="text-red-400 ml-0.5" aria-label="required">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-slate-600">{hint}</p>}
      {error && (
        <div className="flex items-start gap-1.5" role="alert">
          <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[10px] text-red-400 leading-tight">{error}</p>
        </div>
      )}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  cn(
    "w-full bg-slate-800/60 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600",
    "outline-none transition-all duration-150",
    "focus:bg-slate-800 focus:ring-1",
    hasError
      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
      : "border-slate-700/60 focus:border-blue-500/60 focus:ring-blue-500/20 hover:border-slate-600"
  );

const AGREEMENT_TYPES = ["ISDA", "CSA", "GMRA", "GMSLA", "FX Forward", "Repo", "Stock Loan",
  "OTC_AG1", "OTC_AG2zb", "Clearing_AG1", "TCW IM vs BOFA Legacy",
  "CSA Agreement", "MBK SEC OTC", "NT-Dispute", "Other"];
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "HKD"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface DisputeFormProps {
  onResult: (input: DisputeInput, result: AnalysisResponse) => void;
  onPendingChange?: (isPending: boolean) => void;
  /** Pre-filled values coming from the CSV uploader */
  prefillValues?: Partial<DisputeFormData>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DisputeForm({ onResult, onPendingChange, prefillValues }: DisputeFormProps) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { currency: "USD" },
  });

  // ── When CSV row changes, inject values into the form ─────────────────────
  useEffect(() => {
    if (!prefillValues) return;
    (Object.entries(prefillValues) as [keyof DisputeFormData, DisputeFormData[keyof DisputeFormData]][]).forEach(
      ([key, val]) => {
        if (val !== undefined && val !== null) {
          setValue(key, val as never, { shouldValidate: false });
        }
      }
    );
  }, [prefillValues, setValue]);

  const { mutate, isPending, isError, error } = useAnalyzeDispute();

  const onSubmit = (data: DisputeFormData) => {
    const input: DisputeInput = {
      dispute_id: data.dispute_id,
      counterparty_code: data.counterparty_code,
      agreement_type: data.agreement_type,
      currency: data.currency,
      dispute_amount: data.dispute_amount,
      their_exposure: data.their_exposure ?? data.dispute_amount,
      free_text_comment: data.free_text_comment,
      current_status_code: data.call_status_code || "OPEN",
      dispute_age_days: data.dispute_age_days || 0,
    };

    onPendingChange?.(true);
    mutate(input, {
      onSuccess: (result) => {
        onResult(input, result);
        onPendingChange?.(false);
      },
      onError: () => onPendingChange?.(false),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Dispute analysis form"
      className="space-y-5"
    >
      {/* ── Identifiers ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionDivider label="Identification" />
        <Field id="dispute_id" label="SNAPSHOT_ID" error={errors.dispute_id?.message} icon={Hash} required>
          <input
            id="dispute_id"
            type="text"
            placeholder="e.g. LIT-2024-00123"
            className={inputClass(!!errors.dispute_id)}
            {...register("dispute_id")}
          />
        </Field>
        <Field id="counterparty_code" label="COUNTERPARTY_CODE" error={errors.counterparty_code?.message} icon={Building2} required>
          <input
            id="counterparty_code"
            type="text"
            placeholder="e.g. CPTY_7501"
            className={inputClass(!!errors.counterparty_code)}
            {...register("counterparty_code")}
          />
        </Field>
      </div>

      {/* ── Agreement ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionDivider label="Agreement" />
        <div className="grid grid-cols-2 gap-3">
          <Field id="agreement_type" label="AGREEMENT_DESC" error={errors.agreement_type?.message} icon={FileText} required>
            <select id="agreement_type" className={cn(inputClass(!!errors.agreement_type), "cursor-pointer")} {...register("agreement_type")}>
              <option value="">Select…</option>
              {AGREEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field id="currency" label="CURRENCY" error={errors.currency?.message} icon={Globe} required>
            <select id="currency" className={cn(inputClass(!!errors.currency), "cursor-pointer")} {...register("currency")}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Financial ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionDivider label="Financial" />
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="dispute_amount"
            label="DISPUTE_AMOUNT"
            error={errors.dispute_amount?.message}
            icon={DollarSign}
            required
          >
            <input
              id="dispute_amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 75 000"
              className={inputClass(!!errors.dispute_amount)}
              {...register("dispute_amount", { valueAsNumber: true })}
            />
          </Field>
          <Field
            id="their_exposure"
            label="THEIR_EXPOSURE"
            error={errors.their_exposure?.message}
            icon={Activity}
          >
            <input
              id="their_exposure"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 75 000"
              className={inputClass(!!errors.their_exposure)}
              {...register("their_exposure", { valueAsNumber: true })}
            />
          </Field>
        </div>
      </div>

      {/* ── Timing & Status ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionDivider label="Timing & Status" />
        <div className="grid grid-cols-2 gap-3">
          <Field id="call_date" label="CALL_DATE" error={errors.call_date?.message} icon={Calendar}>
            <input
              id="call_date"
              type="date"
              className={inputClass(!!errors.call_date)}
              {...register("call_date")}
            />
          </Field>
          <Field id="call_status_code" label="CALL_STATUS_CODE" error={errors.call_status_code?.message} icon={Layers}>
            <input
              id="call_status_code"
              type="text"
              placeholder="OPEN"
              className={inputClass(!!errors.call_status_code)}
              {...register("call_status_code")}
            />
          </Field>
          <Field id="dispute_age_days" label="DISPUTE_AGE_DAYS" error={errors.dispute_age_days?.message} icon={Clock}>
            <input
              id="dispute_age_days"
              type="number"
              placeholder="0"
              className={inputClass(!!errors.dispute_age_days)}
              {...register("dispute_age_days", { valueAsNumber: true })}
            />
          </Field>
          <Field id="total_dispute_age" label="TOTAL_DISPUTE_AGE" error={errors.total_dispute_age?.message} icon={Clock}>
            <input
              id="total_dispute_age"
              type="number"
              placeholder="0"
              className={inputClass(!!errors.total_dispute_age)}
              {...register("total_dispute_age", { valueAsNumber: true })}
            />
          </Field>
        </div>
        <Field id="dispute_event_id" label="DISPUTE_EVENT_ID" error={errors.dispute_event_id?.message} icon={Hash}>
          <input
            id="dispute_event_id"
            type="text"
            placeholder="Event ID..."
            className={inputClass(!!errors.dispute_event_id)}
            {...register("dispute_event_id")}
          />
        </Field>
      </div>

      {/* ── Narrative ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionDivider label="Narrative" />
        <Field
          id="free_text_comment"
          label="ORIGINAL_COMMENT"
          error={errors.free_text_comment?.message}
          icon={MessageSquare}
          required
          hint="Entrée principale pour le moteur RAG"
        >
          <textarea
            id="free_text_comment"
            rows={4}
            placeholder="Décrivez la nature du litige, le point de désaccord…"
            className={cn(inputClass(!!errors.free_text_comment), "resize-none leading-relaxed")}
            {...register("free_text_comment")}
          />
        </Field>
      </div>

      {/* ── API Error ─────────────────────────────────────────────── */}
      {isError && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl" role="alert">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-400">Analyse échouée</p>
            <p className="text-[11px] text-red-400/80 mt-0.5">{error?.message}</p>
          </div>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => reset({ currency: "USD" })}
          disabled={isPending}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Analyse en cours…</span></>
          ) : (
            <><Send className="w-4 h-4" /><span>Analyser le litige</span></>
          )}
        </button>
      </div>
    </form>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
      <span className="w-4 h-px bg-slate-700" />
      {label}
      <span className="flex-1 h-px bg-slate-700" />
    </p>
  );
}
