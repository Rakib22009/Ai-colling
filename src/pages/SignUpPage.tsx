import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, AtSign, Languages, Loader2, Mail, User } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { UiLanguageSwitcher } from '../components/UiLanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import type { LangCode } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

export const SignUpPage: React.FC<Props> = ({ onNavigate }) => {
  const { signupWithGoogle, signupWithEmailAccount, lastAuthError, clearAuthError } = useAuth();
  const { t } = useI18n();
  const [preferredLang, setPreferredLang] = useState<LangCode>('bn');
  const [customHandle, setCustomHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleSignUp = async () => {
    setLoadingGoogle(true);
    const ok = await signupWithGoogle(preferredLang, customHandle.trim() || undefined);
    setLoadingGoogle(false);
    if (ok) {
      onNavigate('/');
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !displayName.trim()) return;
    setLoadingEmail(true);
    await signupWithEmailAccount({
      email,
      password,
      displayName,
      preferredLanguage: preferredLang,
      customHandle: customHandle.trim() || undefined,
    });
    setLoadingEmail(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-5">
        <button
          type="button"
          onClick={() => {
            clearAuthError();
            onNavigate('/login');
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.auth.backToSignIn}
        </button>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 space-y-5">
          <div>
            <h1 className="font-display font-bold text-xl">{t.auth.signupTitle}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.auth.signupSubtitle}
            </p>
          </div>

          <UiLanguageSwitcher />

          {lastAuthError && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-semibold">{t.auth.oauthNoticeTitle}</p>
                <p className="leading-relaxed">{lastAuthError}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.auth.primarySpokenLang}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPreferredLang('bn')}
                className={`min-h-[58px] p-3 rounded-xl border text-left transition-colors ${
                  preferredLang === 'bn'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <p className="text-sm font-semibold">Bangla</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.auth.banglaSub}</p>
              </button>
              <button
                type="button"
                onClick={() => setPreferredLang('id')}
                className={`min-h-[58px] p-3 rounded-xl border text-left transition-colors ${
                  preferredLang === 'id'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <p className="text-sm font-semibold">Indonesian</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.auth.indonesianSub}</p>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-handle" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <AtSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.auth.handleLabel}
            </label>
            <input
              id="signup-handle"
              type="text"
              value={customHandle}
              onChange={(e) => setCustomHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="e.g., rohan-dhaka"
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t.auth.handleHint}
            </p>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="signup-name" className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {t.auth.displayNameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t.auth.namePlaceholder}
                  className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-email" className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="signup-password" className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {t.auth.passwordLabel}
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingEmail || loadingGoogle}
              className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loadingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingEmail ? t.auth.creatingAccount : t.auth.signUpEmailBtn}
            </button>
          </form>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider">
              {t.auth.orContinueWith}
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          <GoogleSignInButton
            onClick={handleGoogleSignUp}
            disabled={loadingGoogle || loadingEmail}
            label={loadingGoogle ? t.auth.creatingAccount : t.auth.continueGoogleBtn}
            className="w-full"
          />

          <div className="text-center pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.auth.alreadyHaveAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  clearAuthError();
                  onNavigate('/login');
                }}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {t.auth.signInLink}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
