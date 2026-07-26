"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle, Languages } from "lucide-react";
import { apiClient } from "@/lib/api";

const i18n = {
  fr: {
    title: "Connexion",
    subtitle: "Accédez à votre espace CollateralGPT",
    email: "Email",
    password: "Mot de passe",
    show: "Afficher",
    hide: "Masquer",
    submit: "Se connecter",
    loading: "Connexion...",
    error: "Email ou mot de passe incorrect.",
  },
  en: {
    title: "Sign In",
    subtitle: "Access your CollateralGPT workspace",
    email: "Email",
    password: "Password",
    show: "Show",
    hide: "Hide",
    submit: "Sign in",
    loading: "Signing in...",
    error: "Invalid email or password.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang]         = useState<"fr" | "en">("fr");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const t = i18n[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/auth/login", {
        email,
        mot_de_passe: password,
      });
      localStorage.setItem("cgpt_token", data.access_token);
      localStorage.setItem("cgpt_user", JSON.stringify({
        id: data.user_id,
        email: data.email,
        nom: data.nom || "",
        prenom: data.prenom || "",
      }));
      // Persist chosen language for the app
      localStorage.setItem("cgpt_lang", lang);
      router.replace("/");
    } catch {
      setError(t.error);
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
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10 mt-1"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <LogIn className="w-4 h-4" />
              }
              {loading ? t.loading : t.submit}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          CollateralGPT © {new Date().getFullYear()} — Vermeg
        </p>
      </div>
    </div>
  );
}
