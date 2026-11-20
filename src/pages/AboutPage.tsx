import React, { useEffect, useState } from 'react';
import { CheckCircle2, Globe, Lock, Mic, Radio, Shield } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export const AboutPage: React.FC = () => {
  const { t } = useI18n();
  const [health, setHealth] = useState<{
    ok?: boolean;
    geminiConfigured?: boolean;
    firebaseConfigured?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">{t.about.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.about.subtitle}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">{t.about.howItWorksTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.about.dualStreamTitle}
            </p>
            <p className="text-xs">{t.about.dualStreamDesc}</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.about.webrtcTitle}
            </p>
            <p className="text-xs">{t.about.webrtcDesc}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">{t.about.securityTitle}</h2>
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>{t.about.zeroDemoTitle}</strong> {t.about.zeroDemoDesc}
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>{t.about.noRecordTitle}</strong> {t.about.noRecordDesc}
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>{t.about.fidelityTitle}</strong> {t.about.fidelityDesc}
            </span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
        <h2 className="font-display font-semibold text-base">{t.about.readinessTitle}</h2>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${health?.ok ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>
              {t.about.backendServer} {health?.ok ? t.about.ready : t.about.checking}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${health?.geminiConfigured ? 'text-emerald-600' : 'text-amber-500'}`}
            />
            <span>
              {t.about.geminiLive} {health?.geminiConfigured ? t.about.configured : t.about.missingKey}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${health?.firebaseConfigured ? 'text-emerald-600' : 'text-amber-500'}`}
            />
            <span>
              {t.about.firebaseProject} {health?.firebaseConfigured ? t.about.connected : t.about.pending}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
