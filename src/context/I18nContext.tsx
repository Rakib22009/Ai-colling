import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS, type TranslationDict, type UiLang } from '../i18n/translations';

const STORAGE_KEY = 'linguaconnect_ui_lang';

interface I18nContextValue {
  uiLang: UiLang;
  setUiLang: (lang: UiLang) => void;
  t: TranslationDict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

function readInitialLang(): UiLang {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'bn' || saved === 'id' || saved === 'en') {
    return saved;
  }
  return 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiLang, setUiLangState] = useState<UiLang>(readInitialLang);

  const setUiLang = useCallback((lang: UiLang) => {
    setUiLangState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = uiLang;
  }, [uiLang]);

  return (
    <I18nContext.Provider value={{ uiLang, setUiLang, t: TRANSLATIONS[uiLang] }}>
      {children}
    </I18nContext.Provider>
  );
};
