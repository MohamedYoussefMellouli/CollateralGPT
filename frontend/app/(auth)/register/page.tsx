"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api";

const i18n = {
  fr: {
    title: "Créer un compte",
    subtitle: "Rejoignez votre espace CollateralGPT",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Email",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    show: "Afficher",
    hide: "Masquer",
    submit: "Créer mon compte",
    loading: "Création...",
    weak: "Faible",
    medium: "Moyen",
    strong: "Fort",
    alreadyAccount: "Déjà un compte ?",
    signIn: "Se connecter",
    errorMatch: "Les mots de passe ne correspondent pas.",
    errorShort: "Le mot de passe doit contenir au moins 6 caractères.",
    errorGeneric: "Erreur lors de la création du compte.",
    errorEmail: "Cet email est déjà utilisé.",
  },
  en: {
    title: "Create an account",
    subtitle: "Join your CollateralGPT workspace",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    show: "Show",
    hide: "Hide",
    submit: "Create my account",
    loading: "Creating...",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    alreadyAccount: "Already have an account?",
    signIn: "Sign in",
    errorMatch: "Passwords do not match.",
    errorShort: "Password must be at least 6 characters.",
    errorGeneric: "Error creating account.",
    errorEmail: "This email is already in use.",
  },
};

function passwordStrength(pwd: string): "weak" | "medium" | "strong" | null {
  if (pwd.length === 0) return null;
  if (pwd.length < 6) return "weak";
  if (pwd.length < 10) return "medium";
  return "strong";
}

export default function RegisterPage() {
  const router = useRouter();
  const [lang, setLang]         = useState<"fr" | "en">("fr");
  const [prenom, setPrenom]     = useState("");
  const [nom, setNom]           = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const t = i18n[lang];
  const strength = passwordStrength(password);

  const strengthColors: Record<string, string> = {
    weak:   "bg-red-500",
    medium: "bg-amber-400",
    strong: "bg-emerald-400",
  };
  const strengthTextColors: Record<string, string> = {
    weak:   "text-red-400",
    medium: "text-amber-400",
    strong: "text-emerald-400",
  };
  const strengthLabel: Record<string, string> = {
    weak:   t.weak,
    medium: t.medium,
    strong: t.strong,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError(t.errorMatch); return; }
    if (password.length < 6)  { setError(t.errorShort); return; }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/auth/register", {
        email,
        mot_de_passe: password,
        nom,
        prenom,
      });

      localStorage.setItem("cgpt_token", data.access_token);
      localStorage.setItem("cgpt_user", JSON.stringify({
        id:     data.user_id,
        email:  data.email,
        nom:    data.nom   || "",
        prenom: data.prenom || "",
      }));
      localStorage.setItem("cgpt_lang", lang);

      router.replace("/");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "";
      if (detail.toLowerCase().includes("déjà") || detail.toLowerCase().includes("already")) {
        setError(t.errorEmail);
      } else {
        setError(detail || t.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo + langue toggle */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <img src="/logo.png" alt="CollateralGPT" className="h-14 w-auto object-contain" />
          <p className="text-xs text-slate-500 uppercase tracking-widest">Decision Engine</p>

          {/* FR / EN toggle */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  lang === l
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">{t.title}</h2>
          <p className="text-xs text-slate-500 mb-5">{t.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Prénom + Nom (côte à côte) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t.firstName}
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Yassine"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {t.lastName}
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Mellouli"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@vermeg.com"
                required
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPwd ? t.hide : t.show}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indicateur de force */}
              {strength && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {(["weak", "medium", "strong"] as const).map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strength === "weak"   && i === 0 ? strengthColors.weak   :
                          strength === "medium" && i <= 1  ? strengthColors.medium :
                          strength === "strong"            ? strengthColors.strong :
                          "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${strengthTextColors[strength]}`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmer le mot de passe */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t.confirmPassword}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                    confirm && password !== confirm
                      ? "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20"
                      : "border-slate-700 focus:border-blue-500/60 focus:ring-blue-500/20"
                  }`}
                />
                {confirm && password === confirm && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading || !email || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10 mt-1"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserPlus className="w-4 h-4" />
              }
              {loading ? t.loading : t.submit}
            </button>
          </form>

          {/* Lien vers login */}
          <p className="text-center text-xs text-slate-500 mt-5">
            {t.alreadyAccount}{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {t.signIn}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          CollateralGPT © {new Date().getFullYear()} — Vermeg
        </p>
      </div>
    </div>
  );
}
