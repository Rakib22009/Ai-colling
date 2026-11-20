import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { UI_LANG_OPTIONS, type UiLang } from '../i18n/translations';

interface Props {
  compact?: boolean;
  className?: string;
}

export const UiLanguageSwitcher: React.FC<Props> = ({ compact = false, className = '' }) => {
  const { uiLang, setUiLang, t } = useI18n();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <select
          value={uiLang}
          onChange={(e) => setUiLang(e.target.value as UiLang)}
          aria-label={t.common.uiLanguageLabel}
          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {UI_LANG_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.nativeLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {t.auth.chooseWebsiteLanguage}
      </label>
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {UI_LANG_OPTIONS.map((opt) => {
          const active = uiLang === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setUiLang(opt.code)}
              className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-medium transition-colors truncate ${
                active
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
