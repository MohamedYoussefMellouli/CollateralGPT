"use client";

import { useEffect, useState } from "react";

export type Language = "en" | "fr";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("fr");

  useEffect(() => {
    // Charger la langue depuis localStorage au montage
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage: Language = language === "fr" ? "en" : "fr";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
  };

  const setLang = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return { language, toggleLanguage, setLang };
}
