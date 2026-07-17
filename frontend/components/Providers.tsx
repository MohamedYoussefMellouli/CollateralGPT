"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import { createContext, useContext, ReactNode } from "react";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { translations, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within Providers");
  }
  return context;
}

export function Providers({ children }: { children: ReactNode }) {
  const { language, toggleLanguage, setLang } = useLanguage();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLang, t }}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0f172a",
              border: "1px solid #1e293b",
              color: "#e2e8f0",
            },
          }}
        />
      </QueryClientProvider>
    </LanguageContext.Provider>
  );
}
