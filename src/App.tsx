import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { UiLanguageSwitcher } from './components/UiLanguageSwitcher';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { AboutPage } from './pages/AboutPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { FriendsPage } from './pages/FriendsPage';
import { HomeDashboard } from './pages/HomeDashboard';
import { LanguageSettingsPage } from './pages/LanguageSettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SignUpPage } from './pages/SignUpPage';
import { SplashPage } from './pages/SplashPage';
import { VideoCallPage } from './pages/VideoCallPage';
import { VoiceCallPage } from './pages/VoiceCallPage';

const AppRouter: React.FC = () => {
  const {
    firebaseUser,
    authReady,
    needsEmailVerification,
    resendVerificationEmail,
    checkEmailVerified,
    logout,
  } = useAuth();
  const { t } = useI18n();
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [checkingVerify, setCheckingVerify] = useState(false);

  const navigate = useCallback((nextPath: string) => {
    const normalized = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setPathname(normalized);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/');
    const onCustomNav = (e: Event) => {
      const detail = (e as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) navigate(detail.url);
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('lingua-navigate', onCustomNav);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('lingua-navigate', onCustomNav);
    };
  }, [navigate]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090D16] gap-4">
        <img
          src="/src/assets/images/linguaconnect_emblem_1795114125651.jpg"
          alt="LinguaConnect AI"
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-2xl object-cover"
        />
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>{t.common.loading}</span>
        </div>
      </div>
    );
  }

  if (needsEmailVerification && firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 space-y-5 text-center">
          <UiLanguageSwitcher />
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MailCheck className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-bold text-xl">{t.auth.verifyTitle}</h1>
            <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">{firebaseUser.email}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t.auth.verifyBody}</p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={checkingVerify}
              onClick={async () => {
                setCheckingVerify(true);
                await checkEmailVerified();
                setCheckingVerify(false);
              }}
              className="w-full min-h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {checkingVerify && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.auth.verifyCheckBtn}
            </button>
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="w-full min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.auth.verifyResendBtn}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full min-h-[40px] text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
            >
              {t.auth.verifySignOutBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (pathname === '/splash') {
      return <SplashPage onNavigate={navigate} />;
    }
    if (pathname === '/login') {
      if (firebaseUser) return <HomeDashboard onNavigate={navigate} />;
      return <LoginPage onNavigate={navigate} />;
    }
    if (pathname === '/signup') {
      if (firebaseUser) return <HomeDashboard onNavigate={navigate} />;
      return <SignUpPage onNavigate={navigate} />;
    }
    if (pathname.startsWith('/profile/')) {
      const uidOrHandle = decodeURIComponent(pathname.slice('/profile/'.length).split('/')[0] || '');
      return <ProfilePage uidOrHandle={uidOrHandle} onNavigate={navigate} />;
    }
    if (pathname.startsWith('/u/')) {
      const handle = decodeURIComponent(pathname.slice('/u/'.length).split('/')[0] || '');
      return <ProfilePage uidOrHandle={handle} onNavigate={navigate} />;
    }
    if (pathname === '/about') {
      return <AboutPage />;
    }

    // Protected authenticated pages
    if (!firebaseUser) {
      return <SplashPage onNavigate={navigate} />;
    }

    if (pathname === '/friends') return <FriendsPage onNavigate={navigate} />;
    if (pathname === '/languages') return <LanguageSettingsPage />;
    if (pathname === '/history') return <CallHistoryPage onNavigate={navigate} />;
    if (pathname === '/settings') return <SettingsPage />;
    if (pathname.startsWith('/call/voice')) return <VoiceCallPage onNavigate={navigate} />;
    if (pathname.startsWith('/call/video')) return <VideoCallPage onNavigate={navigate} />;

    return <HomeDashboard onNavigate={navigate} />;
  };

  const isStandaloneAuthRoute =
    pathname === '/splash' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    (!firebaseUser && !pathname.startsWith('/profile/') && !pathname.startsWith('/u/') && pathname !== '/about');

  return (
    <CallProvider onNavigate={navigate}>
      {isStandaloneAuthRoute ? (
        renderContent()
      ) : (
        <Layout currentPath={pathname} onNavigate={navigate}>
          {renderContent()}
        </Layout>
      )}
    </CallProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
