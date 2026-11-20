import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, Loader2, Mail, Phone, UserPlus, Video, X } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { UiLanguageSwitcher } from '../components/UiLanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useI18n } from '../context/I18nContext';
import { resolveProfileByUidOrHandle, respondToFriendRequest, sendFriendRequestToUser } from '../firebase';
import { LANGUAGE_LABELS, PublicProfile } from '../types';

interface Props {
  uidOrHandle: string;
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<Props> = ({ uidOrHandle, onNavigate }) => {
  const {
    firebaseUser,
    privateUser,
    friends,
    outgoingRequests,
    incomingRequests,
    loginWithGoogle,
    pushToast,
  } = useAuth();
  const { startCall } = useCall();
  const { t } = useI18n();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sendingReq, setSendingReq] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    resolveProfileByUidOrHandle(uidOrHandle)
      .then((res) => {
        if (!res) setNotFound(true);
        setProfile(res);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [firebaseUser, uidOrHandle]);

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-center space-y-5">
          <div className="flex justify-end">
            <UiLanguageSwitcher compact />
          </div>
          <h1 className="font-display font-bold text-xl">{t.profile.signInPromptTitle}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.profile.signInPromptDesc}</p>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="w-full min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {t.auth.signInEmailBtn}
            </button>
            <GoogleSignInButton
              onClick={() => void loginWithGoogle()}
              label={t.auth.signInGoogleBtn}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">{t.profile.loading}</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display font-bold text-xl">{t.profile.notFoundTitle}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t.profile.notFoundDesc} &ldquo;{uidOrHandle}&rdquo;.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="min-h-[42px] px-4 rounded-xl bg-emerald-600 text-white text-sm font-medium inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.profile.backDashboard}
        </button>
      </div>
    );
  }

  const isSelf = privateUser?.uid === profile.uid;
  const isFriend = friends.some((f) => f.uid === profile.uid);
  const isPendingOutgoing = outgoingRequests.some((r) => r.toUid === profile.uid);
  const incomingReq = incomingRequests.find((r) => r.fromUid === profile.uid);
  const isPendingIncoming = Boolean(incomingReq);

  const canonicalUrl = `${window.location.origin}/profile/${profile.uid}`;
  const handleUrl = `${window.location.origin}/u/${profile.handle}`;

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    pushToast('success', `${t.common.copied}: ${url}`);
  };

  const handleAddFriend = async () => {
    if (!privateUser) return;
    setSendingReq(true);
    try {
      await sendFriendRequestToUser(privateUser, profile);
      pushToast('success', `${t.profile.friendReqSent}: ${profile.displayName}`);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to send request.');
    } finally {
      setSendingReq(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.profile.backDashboard}
      </button>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-2xl">{profile.displayName}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                @{profile.handle} · {profile.online ? t.common.online : t.common.offline} ·{' '}
                {LANGUAGE_LABELS[profile.preferredLanguage].native} (
                {LANGUAGE_LABELS[profile.preferredLanguage].name})
              </p>
              {profile.bio && (
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Direct Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {isSelf ? (
            <button
              type="button"
              onClick={() => onNavigate('/settings')}
              className="min-h-[44px] px-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium"
            >
              {t.profile.editMyProfile}
            </button>
          ) : isFriend ? (
            <>
              <button
                type="button"
                onClick={() =>
                  void startCall(
                    {
                      uid: profile.uid,
                      displayName: profile.displayName,
                      photoURL: profile.photoURL,
                      preferredLanguage: profile.preferredLanguage,
                    },
                    'voice'
                  )
                }
                className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                {t.profile.voiceCall}
              </button>
              <button
                type="button"
                onClick={() =>
                  void startCall(
                    {
                      uid: profile.uid,
                      displayName: profile.displayName,
                      photoURL: profile.photoURL,
                      preferredLanguage: profile.preferredLanguage,
                    },
                    'video'
                  )
                }
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold inline-flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                {t.profile.videoCall}
              </button>
            </>
          ) : isPendingOutgoing ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              {t.profile.friendReqSent}
            </span>
          ) : isPendingIncoming && incomingReq && privateUser ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={sendingReq}
                onClick={async () => {
                  setSendingReq(true);
                  try {
                    await respondToFriendRequest(incomingReq, privateUser, 'accepted');
                    pushToast('success', `${profile.displayName} — ${t.common.accept}`);
                  } catch (err) {
                    pushToast('error', err instanceof Error ? err.message : 'Unable to accept request.');
                  } finally {
                    setSendingReq(false);
                  }
                }}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t.common.accept}
              </button>
              <button
                type="button"
                disabled={sendingReq}
                onClick={async () => {
                  setSendingReq(true);
                  try {
                    await respondToFriendRequest(incomingReq, privateUser, 'rejected');
                    pushToast('info', `${profile.displayName} — ${t.common.decline}`);
                  } catch (err) {
                    pushToast('error', err instanceof Error ? err.message : 'Unable to decline request.');
                  } finally {
                    setSendingReq(false);
                  }
                }}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {t.common.decline}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddFriend}
              disabled={sendingReq}
              className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {sendingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {t.profile.sendFriendReq}
            </button>
          )}
        </div>

        {/* Shareable Profile URLs */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.profile.shareableLinks}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="font-mono text-xs truncate">{canonicalUrl}</span>
            <button
              type="button"
              onClick={() => void copyLink(canonicalUrl)}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {t.profile.copyUidUrl}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="font-mono text-xs truncate">{handleUrl}</span>
            <button
              type="button"
              onClick={() => void copyLink(handleUrl)}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {t.profile.copyHandleUrl}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
