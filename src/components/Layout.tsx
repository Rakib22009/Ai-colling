import React, { useState } from 'react';
import {
  Bell,
  Check,
  Clock,
  Globe,
  Home,
  Info,
  Languages,
  LogOut,
  Moon,
  Phone,
  PhoneIncoming,
  PhoneOff,
  Settings,
  Sun,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useI18n } from '../context/I18nContext';
import {
  deleteNotificationItem,
  markNotificationRead,
  respondToFriendRequest,
} from '../firebase';
import { LANGUAGE_LABELS } from '../types';
import { UiLanguageSwitcher } from './UiLanguageSwitcher';

interface Props {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ currentPath, onNavigate, children }) => {
  const {
    privateUser,
    publicProfile,
    settings,
    incomingRequests,
    notifications,
    unreadNotificationsCount,
    logout,
    toggleTheme,
    toasts,
    dismissToast,
    pushToast,
  } = useAuth();
  const {
    activeCall,
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    signalConnected,
  } = useCall();
  const { t } = useI18n();

  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const isInCallScreen = currentPath.startsWith('/call/');

  const navItems = [
    { path: '/', label: t.nav.home, icon: Home, badge: 0 },
    { path: '/friends', label: t.nav.friends, icon: Users, badge: incomingRequests.length },
    { path: '/languages', label: t.nav.languages, icon: Languages, badge: 0 },
    { path: '/history', label: t.nav.history, icon: Clock, badge: 0 },
    { path: '/settings', label: t.nav.settings, icon: Settings, badge: 0 },
    { path: '/about', label: t.nav.about, icon: Info, badge: 0 },
  ];

  const mobileNavItems = navItems.slice(0, 5);

  const handleFriendDecision = async (reqId: string, decision: 'accepted' | 'rejected') => {
    if (!privateUser) return;
    const req = incomingRequests.find((r) => r.id === reqId);
    if (!req) return;
    try {
      await respondToFriendRequest(req, privateUser, decision);
      pushToast(
        'success',
        decision === 'accepted'
          ? `${req.fromName} — ${t.common.accept}`
          : `${req.fromName} — ${t.common.decline}`
      );
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to respond to request.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Desktop Left Rail (hidden during full-focus voice/video calls) */}
      {!isInCallScreen && privateUser && (
        <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
            <img
              src="/src/assets/images/linguaconnect_emblem_1795114125651.jpg"
              alt="LinguaConnect AI"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <span className="font-display font-bold text-base tracking-tight whitespace-nowrap shrink-0">
              {t.common.appName}
            </span>
          </div>

          <nav className="flex-1 px-3 py-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => onNavigate(`/profile/${privateUser.uid}`)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
            >
              {privateUser.photoURL ? (
                <img
                  src={privateUser.photoURL}
                  alt={privateUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {privateUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{privateUser.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {LANGUAGE_LABELS[privateUser.preferredLanguage].native} ·{' '}
                  {publicProfile?.online ? t.common.online : t.common.offline}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {settings?.theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {settings?.theme === 'dark' ? t.common.light : t.common.dark}
              </button>
              <button
                type="button"
                onClick={logout}
                className="min-h-[40px] px-3 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                title={t.common.signOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Viewport Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 3-Zone Top Bar */}
        {!isInCallScreen && privateUser && (
          <header className="sticky top-0 z-30 h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            {/* Zone 1: Brand Wordmark */}
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 font-display font-bold text-base tracking-tight whitespace-nowrap shrink-0 lg:hidden"
            >
              <img
                src="/src/assets/images/linguaconnect_emblem_1795114125651.jpg"
                alt="LinguaConnect AI"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover shrink-0"
              />
              <span>{t.common.appName}</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{signalConnected ? t.nav.studioReady : t.nav.connecting}</span>
            </div>

            {/* Zone 2: Concise single-line links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.dashboard}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/friends')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                <span>{t.nav.friends}</span>
                {incomingRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-semibold">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onNavigate(`/profile/${privateUser.uid}`)}
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.myProfile}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/languages')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.languages}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/history')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.calls}
              </button>
            </nav>

            {/* Zone 3: Language selector + Notifications */}
            <div className="flex items-center gap-2 shrink-0">
              <UiLanguageSwitcher compact />
              <button
                type="button"
                onClick={() => setNotifDrawerOpen(true)}
                className="relative min-h-[38px] px-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{t.nav.notifications}</span>
                {(unreadNotificationsCount > 0 || incomingRequests.length > 0) && (
                  <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    ({unreadNotificationsCount + incomingRequests.length})
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {/* Active Call Return Banner if user navigated away */}
        {activeCall && !isInCallScreen && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-xs sm:text-sm font-medium truncate">
              {t.nav.activeCallBanner} {activeCall.peerName}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(`/call/${activeCall.type}/${activeCall.callId}`)}
              className="px-3 py-1.5 rounded-lg bg-white text-emerald-700 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              {t.nav.returnToCall}
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${!isInCallScreen && privateUser ? 'pb-20 lg:pb-8' : ''}`}>
          {children}
        </main>

        {/* Mobile Fixed Bottom Navigation */}
        {!isInCallScreen && privateUser && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
                    active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Notification Slide-Over Drawer */}
      {notifDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-semibold font-display">{t.notificationsDrawer.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setNotifDrawerOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {t.notificationsDrawer.pendingRequests} ({incomingRequests.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifDrawerOpen(false);
                      onNavigate('/friends');
                    }}
                    className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {t.notificationsDrawer.openFriendsPage}
                  </button>
                </div>
                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-3.5 text-center">
                    {t.notificationsDrawer.incomingEmpty}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          {req.fromPhoto ? (
                            <img
                              src={req.fromPhoto}
                              alt={req.fromName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold shrink-0">
                              {req.fromName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{req.fromName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              @{req.fromHandle} · {LANGUAGE_LABELS[req.fromLang].name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleFriendDecision(req.id, 'accepted')}
                            className="flex-1 min-h-[38px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {t.common.accept}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFriendDecision(req.id, 'rejected')}
                            className="flex-1 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {t.common.decline}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.notificationsDrawer.recentAlerts}
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                    {t.notificationsDrawer.empty}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-xl border p-3.5 space-y-2 ${
                          n.read
                            ? 'border-slate-200 dark:border-slate-800 opacity-80'
                            : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.body}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void deleteNotificationItem(n.id)}
                            aria-label={t.common.close}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {!n.read && (
                            <button
                              type="button"
                              onClick={() => void markNotificationRead(n.id)}
                              className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                            >
                              {t.notificationsDrawer.markRead}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              void markNotificationRead(n.id);
                              setNotifDrawerOpen(false);
                              onNavigate(`/profile/${n.fromUid}`);
                            }}
                            className="text-slate-600 dark:text-slate-300 hover:underline"
                          >
                            {t.notificationsDrawer.viewProfile}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Global Incoming Call Overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              {incomingCall.fromPhoto ? (
                <img
                  src={incomingCall.fromPhoto}
                  alt={incomingCall.fromName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-emerald-500/20">
                  {incomingCall.fromName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  {incomingCall.type === 'video' ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : (
                    <PhoneIncoming className="w-3.5 h-3.5" />
                  )}
                  {incomingCall.type === 'video' ? t.call.incomingVideoCall : t.call.incomingVoiceCall}
                </p>
                <h2 className="text-xl font-bold font-display mt-1">{incomingCall.fromName}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {LANGUAGE_LABELS[incomingCall.callerLang].native} →{' '}
                  {LANGUAGE_LABELS[incomingCall.calleeLang].native} {t.call.aiTranslationLabel}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void rejectIncomingCall()}
                className="min-h-[48px] rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
                {t.common.decline}
              </button>
              <button
                type="button"
                onClick={() => void acceptIncomingCall()}
                className="min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {t.common.accept}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 space-y-2 max-w-sm w-[calc(100vw-2rem)]">
          {toasts.map((toastItem) => (
            <div
              key={toastItem.id}
              className={`rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 shadow-sm ${
                toastItem.kind === 'error'
                  ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100'
                  : toastItem.kind === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              <span className="leading-snug">{toastItem.text}</span>
              <button
                type="button"
                onClick={() => dismissToast(toastItem.id)}
                className="text-current opacity-60 hover:opacity-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
