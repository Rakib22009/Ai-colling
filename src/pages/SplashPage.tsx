import React from 'react';
import { ArrowRight, Globe, Mic, ShieldCheck, Video } from 'lucide-react';
import { UiLanguageSwitcher } from '../components/UiLanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface Props {
  onNavigate: (path: string) => void;
}

export const SplashPage: React.FC<Props> = ({ onNavigate }) => {
  const { firebaseUser } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 3-Zone Header */}
      <header className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <img
            src="/src/assets/images/linguaconnect_emblem_1795114125651.jpg"
            alt="LinguaConnect AI"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover shrink-0"
          />
          <span className="font-display font-bold text-lg tracking-tight">{t.common.appName}</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button type="button" onClick={() => onNavigate('/login')} className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            {t.splash.signIn}
          </button>
          <button type="button" onClick={() => onNavigate('/signup')} className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            {t.splash.getStarted}
          </button>
          <button type="button" onClick={() => onNavigate('/about')} className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0">
            {t.splash.architecture}
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <UiLanguageSwitcher compact />
          <button
            type="button"
            onClick={() => onNavigate(firebaseUser ? '/' : '/login')}
            className="min-h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            {firebaseUser ? t.splash.openStudio : t.splash.gmailLogin}
          </button>
        </div>
      </header>

      {/* Main Editorial Hero Split */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 lg:py-16 grid lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 tracking-wide">
            {t.splash.badge}
          </p>

          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.12] text-balance">
            {t.splash.heroTitle}
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            {t.splash.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate(firebaseUser ? '/' : '/login')}
              className="min-h-[48px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              {firebaseUser ? t.splash.enterStudio : t.splash.continueWithGmail}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="min-h-[48px] px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap"
            >
              {t.splash.createProfileUrl}
            </button>
          </div>

          <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.splash.dualStreamsTitle}</span>
              </div>
              <p>{t.splash.dualStreamsDesc}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.splash.webrtcTitle}</span>
              </div>
              <p>{t.splash.webrtcDesc}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.splash.privateCallsTitle}</span>
              </div>
              <p>{t.splash.privateCallsDesc}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative flex-1 min-h-[280px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-900">
            <img
              src="/src/assets/images/splash_studio_backdrop_1795114126914.jpg"
              alt="LinguaConnect AI voice studio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-xs text-emerald-300 font-medium">{t.splash.previewLabel}</p>
              <p className="text-sm font-medium mt-1">আমি তোমার সাথে কথা বলতে চাই।</p>
              <p className="text-sm text-emerald-200 mt-0.5">→ Saya ingin berbicara dengan Anda.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <img
                src="/src/assets/images/dhaka_studio_scene_1795114127202.jpg"
                alt="Dhaka Bangla speaker workspace"
                referrerPolicy="no-referrer"
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <p className="text-xs font-semibold">{t.splash.dhakaTitle}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.splash.dhakaDesc}</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <img
                src="/src/assets/images/jakarta_studio_scene_1795114133018.jpg"
                alt="Jakarta Indonesian speaker workspace"
                referrerPolicy="no-referrer"
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <p className="text-xs font-semibold">{t.splash.jakartaTitle}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.splash.jakartaDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-6 py-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          {t.splash.footerNote}
        </span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onNavigate('/about')} className="hover:underline">
            {t.splash.aboutPrivacy}
          </button>
          <button type="button" onClick={() => onNavigate('/login')} className="hover:underline">
            {t.splash.loginLink}
          </button>
        </div>
      </footer>
    </div>
  );
};
