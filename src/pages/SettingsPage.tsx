import React, { useRef, useState } from 'react';
import { Bell, Camera, Check, Loader2, LogOut, Mic, Moon, Shield, Sun } from 'lucide-react';
import { UiLanguageSwitcher } from '../components/UiLanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { updateProfileAndLanguage, updateUserSettings } from '../firebase';
import { showBrowserNotification } from '../utils/notifications';

export const SettingsPage: React.FC = () => {
  const {
    privateUser,
    publicProfile,
    settings,
    notificationPermission,
    enableNotifications,
    toggleTheme,
    logout,
    pushToast,
  } = useAuth();
  const { t } = useI18n();

  const [displayName, setDisplayName] = useState(privateUser?.displayName || '');
  const [handle, setHandle] = useState(privateUser?.handle || '');
  const [bio, setBio] = useState(publicProfile?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [testingMedia, setTestingMedia] = useState(false);
  const [mediaStatus, setMediaStatus] = useState('');
  const testVideoRef = useRef<HTMLVideoElement | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);

  if (!privateUser || !settings) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfileAndLanguage(privateUser, {
        displayName,
        handle,
        bio,
      });
      pushToast('success', 'Profile and unique shareable handle updated.');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTestPermissions = async () => {
    if (testingMedia) {
      testStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      testStreamRef.current = null;
      setTestingMedia(false);
      setMediaStatus('');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      testStreamRef.current = stream;
      setTestingMedia(true);
      setMediaStatus('OK');
      window.setTimeout(() => {
        if (testVideoRef.current) testVideoRef.current.srcObject = stream;
      }, 50);
    } catch (err) {
      setMediaStatus(
        err instanceof Error
          ? err.message
          : 'Microphone or camera permission denied.'
      );
    }
  };

  const handleTestWebPush = async () => {
    const perm = await enableNotifications();
    if (perm === 'granted') {
      await showBrowserNotification({
        title: 'LinguaConnect AI Notifications Active',
        body: 'Incoming voice & video calls and friend requests will alert you here.',
        type: 'system',
        url: '/',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">{t.settings.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.settings.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {settings.theme === 'dark' ? t.settings.lightTheme : t.settings.darkTheme}
        </button>
      </div>

      {/* Website Interface Language */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
        <div>
          <h2 className="font-display font-semibold text-base">{t.settings.websiteLangTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.settings.websiteLangDesc}</p>
        </div>
        <UiLanguageSwitcher />
      </section>

      {/* Profile Management */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
      >
        <h2 className="font-display font-semibold text-base">{t.settings.profileTitle}</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t.settings.displayName}
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t.settings.uniqueHandle}
            </label>
            <input
              type="text"
              required
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              maxLength={48}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {t.settings.bioLabel}
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            placeholder={t.settings.bioPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
            /profile/{privateUser.uid} · /u/{handle}
          </p>
          <button
            type="submit"
            disabled={savingProfile}
            className="min-h-[42px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {t.settings.saveProfile}
          </button>
        </div>
      </form>

      {/* Call & Translation Preferences */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="font-display font-semibold text-base">{t.settings.prefsTitle}</h2>

        <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
          <div>
            <p className="text-sm font-medium">{t.settings.autoStartTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.autoStartDesc}</p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoTranslate}
            onChange={(e) => void updateUserSettings(privateUser.uid, { autoTranslate: e.target.checked })}
            className="w-5 h-5 accent-emerald-600"
          />
        </label>

        <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
          <div>
            <p className="text-sm font-medium">{t.settings.defaultTranslatedTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.defaultTranslatedDesc}</p>
          </div>
          <input
            type="checkbox"
            checked={settings.defaultAudioMode === 'translated'}
            onChange={(e) =>
              void updateUserSettings(privateUser.uid, {
                defaultAudioMode: e.target.checked ? 'translated' : 'original',
              })
            }
            className="w-5 h-5 accent-emerald-600"
          />
        </label>

        <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
          <div>
            <p className="text-sm font-medium">{t.settings.enableCaptionsTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.settings.enableCaptionsDesc}</p>
          </div>
          <input
            type="checkbox"
            checked={settings.captionsEnabled}
            onChange={(e) => void updateUserSettings(privateUser.uid, { captionsEnabled: e.target.checked })}
            className="w-5 h-5 accent-emerald-600"
          />
        </label>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t.settings.noStorageNote}</span>
        </div>
      </section>

      {/* Hardware & Web Push Permissions */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <h2 className="font-display font-semibold text-base">{t.settings.diagnosticsTitle}</h2>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium">{t.settings.webPushTitle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {t.settings.browserPerm} {notificationPermission}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestWebPush}
            className="min-h-[40px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
          >
            {notificationPermission === 'granted' ? t.settings.sendTestNotif : t.settings.enableNotifs}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Mic className="w-4 h-4" />
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.settings.hardwareTitle}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mediaStatus || t.settings.hardwareIdle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestPermissions}
              className="min-h-[40px] px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium"
            >
              {testingMedia ? t.settings.stopTest : t.settings.testMicCam}
            </button>
          </div>

          {testingMedia && (
            <video
              ref={testVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 -scale-x-100"
            />
          )}
        </div>
      </section>

      {/* Sign Out */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t.settings.signedInAs} {privateUser.email}
        </p>
        <button
          type="button"
          onClick={logout}
          className="min-h-[44px] px-5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium inline-flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t.common.signOut}
        </button>
      </div>
    </div>
  );
};
