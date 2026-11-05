import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LanguageContext,
  translate,
  type Language,
  type LanguageContextValue,
} from "./i18n";

const STORAGE_KEY = "linebalance.language.v1";

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "vi") return stored;
  } catch {
    // localStorage can be unavailable; fall through to the browser locale.
  }
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Persisting the language is best-effort.
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (
      key: Parameters<LanguageContextValue["t"]>[0],
      vars?: Parameters<LanguageContextValue["t"]>[1],
    ) => translate(language, key, vars),
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: language === "vi" ? "vi-VN" : "en-GB",
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
