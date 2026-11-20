import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Bell, Loader2, Lock, Mail, Users } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { UiLanguageSwitcher } from '../components/UiLanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface Props {
  onNavigate: (path: string) => void;
  redirectAfterLogin?: string;
}

export const LoginPage: React.FC<Props> = ({ onNavigate, redirectAfterLogin = '/' }) => {
  const { loginWithGoogle, loginWithEmail, sendPasswordReset, lastAuthError, clearAuthError } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleGoogleLogin = async () => {
    setResetMessage('');
    setLoadingGoogle(true);
    const ok = await loginWithGoogle();
    setLoadingGoogle(false);
    if (ok) {
      onNavigate(redirectAfterLogin);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setResetMessage('');
    setLoadingEmail(true);
    const ok = await loginWithEmail(email, password);
    setLoadingEmail(false);
    if (ok) {
      onNavigate(redirectAfterLogin);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      clearAuthError();
      setResetMessage('');
      return;
    }
    const ok = await sendPasswordReset(email);
    if (ok) {
      setResetMessage(t.auth.resetSent);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-5">
        <button
          type="button"
          onClick={() => onNavigate('/splash')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.auth.backToWelcome}
        </button>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/linguaconnect_emblem_1795114125651.jpg"
              alt="LinguaConnect AI"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
            <div>
              <h1 className="font-display font-bold text-xl">{t.auth.loginTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.auth.loginSubtitle}
              </p>
            </div>
          </div>

          {/* Language Selector right on Login screen */}
          <UiLanguageSwitcher />

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.auth.loginDesc}
          </p>

          {lastAuthError && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-semibold">{t.auth.oauthNoticeTitle}</p>
                <p className="leading-relaxed">{lastAuthError}</p>
              </div>
            </div>
          )}

          {resetMessage && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-200">
              {resetMessage}
            </div>
          )}

          {/* Email & Password Sign-In Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {t.auth.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={!email.trim()}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-40"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingEmail || loadingGoogle}
              className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loadingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingEmail ? t.auth.signingIn : t.auth.signInEmailBtn}
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
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loadingEmail}
            label={loadingGoogle ? t.auth.signingIn : t.auth.signInGoogleBtn}
            className="w-full"
          />

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t.auth.featureFriends}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t.auth.featurePush}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t.auth.featureSecurity}</span>
            </div>
          </div>

          <div className="text-center pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.auth.noAccountYet}{' '}
              <button
                type="button"
                onClick={() => {
                  clearAuthError();
                  onNavigate('/signup');
                }}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {t.auth.createAccountLink}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
