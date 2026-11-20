import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Languages,
  Loader2,
  Phone,
  Search,
  Send,
  Sparkles,
  UserCheck,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { AddFriendModal } from '../components/AddFriendModal';
import { SmartPhraseDrawer } from '../components/SmartPhraseDrawer';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useI18n } from '../context/I18nContext';
import {
  cancelOutgoingFriendRequest,
  resolveUserByEmailOrHandle,
  respondToFriendRequest,
  sendFriendRequestToUser,
} from '../firebase';
import { FriendView, LANGUAGE_LABELS, LangCode } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const HomeDashboard: React.FC<Props> = ({ onNavigate }) => {
  const {
    privateUser,
    publicProfile,
    friends,
    incomingRequests,
    outgoingRequests,
    callHistory,
    notificationPermission,
    enableNotifications,
    toggleOnlinePresence,
    pushToast,
  } = useAuth();
  const { startCall } = useCall();
  const { t } = useI18n();

  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [phraseDrawerOpen, setPhraseDrawerOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const [quickSearching, setQuickSearching] = useState(false);
  const [quickFound, setQuickFound] = useState<{
    uid: string;
    displayName: string;
    photoURL?: string;
    handle: string;
    preferredLanguage: LangCode;
  } | null>(null);
  const [quickNotFound, setQuickNotFound] = useState('');
  const [quickSending, setQuickSending] = useState(false);

  if (!privateUser) return null;

  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = quickQuery.trim();
    if (!cleaned) return;
    setQuickSearching(true);
    setQuickFound(null);
    setQuickNotFound('');
    try {
      const res = await resolveUserByEmailOrHandle(cleaned);
      if (!res) {
        setQuickNotFound(cleaned);
      } else {
        setQuickFound(res);
      }
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setQuickSearching(false);
    }
  };

  const handleQuickSend = async (target: {
    uid: string;
    displayName: string;
    photoURL?: string;
    handle: string;
  }) => {
    setQuickSending(true);
    try {
      await sendFriendRequestToUser(privateUser, target);
      pushToast('success', `${target.displayName} — ${t.addFriend.sendRequest}`);
      setQuickFound(null);
      setQuickQuery('');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Could not send friend request.');
    } finally {
      setQuickSending(false);
    }
  };

  const myLang = privateUser.preferredLanguage;
  const partnerDefaultLang = myLang === 'bn' ? 'id' : 'bn';
  const myProfileUrl = `${window.location.origin}/profile/${privateUser.uid}`;

  const copyProfileUrl = async () => {
    await navigator.clipboard.writeText(myProfileUrl);
    pushToast('success', t.common.copied);
  };

  const handleCallFriend = async (friend: FriendView, type: 'voice' | 'video') => {
    await startCall(
      {
        uid: friend.uid,
        displayName: friend.displayName,
        photoURL: friend.photoURL,
        preferredLanguage: friend.preferredLanguage,
      },
      type
    );
  };

  const handleRespondRequest = async (reqId: string, decision: 'accepted' | 'rejected') => {
    const req = incomingRequests.find((r) => r.id === reqId);
    if (!req) return;
    try {
      await respondToFriendRequest(req, privateUser, decision);
      pushToast(
        'success',
        decision === 'accepted' ? `${req.fromName} — ${t.common.accept}` : t.common.decline
      );
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Action failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Direct Web Push Notification Request Banner */}
      {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.dashboard.enablePushTitle}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {t.dashboard.enablePushDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={enableNotifications}
            className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            {t.dashboard.allowNotifications}
          </button>
        </div>
      )}

      {/* Top Grid: Profile & Language Pair */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {privateUser.photoURL ? (
                <img
                  src={privateUser.photoURL}
                  alt={privateUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {privateUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display font-bold text-xl truncate">{privateUser.displayName}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {privateUser.email} · @{privateUser.handle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleOnlinePresence}
              className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${
                publicProfile?.online
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {publicProfile?.online ? t.dashboard.statusOnline : t.dashboard.statusOffline}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.uniqueProfileUrl}</p>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate mt-0.5">
                {myProfileUrl}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyProfileUrl}
                className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                {t.dashboard.copyLink}
              </button>
              <button
                type="button"
                onClick={() => onNavigate(`/profile/${privateUser.uid}`)}
                className="min-h-[40px] px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t.common.open}
              </button>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dashboard.activeBidirectional}
              </p>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="font-display font-bold text-lg">
                  {LANGUAGE_LABELS[myLang].native}
                </span>
                <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-display font-bold text-lg text-emerald-700 dark:text-emerald-400">
                  {LANGUAGE_LABELS[partnerDefaultLang].native}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.dashboard.youSpeakPrefix} {LANGUAGE_LABELS[myLang].name} · {t.dashboard.voicePersonaPrefix} {privateUser.voiceName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/languages')}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Languages className="w-3.5 h-3.5" />
              {t.dashboard.configure}
            </button>
          </div>

          <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAddFriendOpen(true)}
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              {t.dashboard.addFriendGmail}
            </button>
            <button
              type="button"
              onClick={() => setPhraseDrawerOpen(true)}
              className="min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.dashboard.aiPhrase}
            </button>
          </div>
        </section>
      </div>

      {/* Dedicated Two-Column Friend Requests Bar: Send Request (Left) & Incoming Requests (Right) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Inline Send Friend Request Card */}
        <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.dashboard.quickSendTitle}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/friends')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              {t.dashboard.manageFriendsBtn}
            </button>
          </div>

          <form onSubmit={handleQuickLookup} className="flex gap-2">
            <input
              type="text"
              required
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder={t.dashboard.quickSendPlaceholder}
              className="flex-1 min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={quickSearching}
              className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {quickSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t.addFriend.find}
            </button>
          </form>

          {quickFound && (() => {
            const revReq = incomingRequests.find((r) => r.fromUid === quickFound.uid);
            const alreadyConnected =
              friends.some((f) => f.uid === quickFound.uid) ||
              outgoingRequests.some((r) => r.toUid === quickFound.uid);
            return (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{quickFound.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    @{quickFound.handle} · {LANGUAGE_LABELS[quickFound.preferredLanguage].native}
                  </p>
                </div>
                {quickFound.uid === privateUser.uid ? null : revReq ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRespondRequest(revReq.id, 'accepted')}
                      className="min-h-[36px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      {t.common.accept}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRespondRequest(revReq.id, 'rejected')}
                      className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      {t.common.decline}
                    </button>
                  </div>
                ) : alreadyConnected ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {t.addFriend.connectedOrPending}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={quickSending}
                    onClick={() => void handleQuickSend(quickFound)}
                    className="min-h-[38px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {quickSending ? t.addFriend.sending : t.addFriend.sendRequest}
                  </button>
                )}
              </div>
            );
          })()}

          {quickNotFound && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold">{quickNotFound}</span> {t.addFriend.notRegisteredTitle}
            </p>
          )}
        </section>

        {/* Always-Visible Incoming Friend Requests Card */}
        <section className="lg:col-span-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.dashboard.incomingRequests} ({incomingRequests.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/friends')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          {incomingRequests.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-3 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              {t.dashboard.incomingEmpty}
            </p>
          ) : (
            <div className="space-y-2.5">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{req.fromName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        @{req.fromHandle} · {LANGUAGE_LABELS[req.fromLang].name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, 'accepted')}
                      className="min-h-[38px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.common.accept}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, 'rejected')}
                      aria-label={t.common.decline}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Main Split: Friends Directory & Recent Calls */}
      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-lg">{t.dashboard.friendsDirectory}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.dashboard.friendsSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddFriendOpen(true)}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t.dashboard.invite}
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="py-10 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl px-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.dashboard.noFriendsTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t.dashboard.noFriendsDesc}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddFriendOpen(true)}
                  className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {t.dashboard.addFriendGmail}
                </button>
                <button
                  type="button"
                  onClick={copyProfileUrl}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  {t.dashboard.copyMyLink}
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(`/profile/${friend.uid}`)}
                    className="flex items-center gap-3 min-w-0 text-left group"
                  >
                    {friend.photoURL ? (
                      <img
                        src={friend.photoURL}
                        alt={friend.displayName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold shrink-0">
                        {friend.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {friend.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {friend.online ? t.common.online : t.common.offline} · {LANGUAGE_LABELS[friend.preferredLanguage].native} · @{friend.handle}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleCallFriend(friend, 'voice')}
                      className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {t.common.voice}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallFriend(friend, 'video')}
                      className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Video className="w-3.5 h-3.5" />
                      {t.common.video}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outgoingRequests.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                {t.dashboard.pendingSent} ({outgoingRequests.length})
              </p>
              <div className="space-y-2">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-300 truncate">
                      {t.dashboard.waitingFor} {req.toName} (@{req.toHandle})
                    </span>
                    <button
                      type="button"
                      onClick={() => void cancelOutgoingFriendRequest(req.id)}
                      className="text-red-600 dark:text-red-400 hover:underline shrink-0"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Recent Calls */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.dashboard.recentCalls}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/history')}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              {t.dashboard.viewAll}
            </button>
          </div>

          {callHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
              {t.dashboard.noCallsYet}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {callHistory.slice(0, 6).map((call) => {
                const isCaller = call.callerUid === privateUser.uid;
                const peerName = isCaller ? call.calleeName : call.callerName;
                const peerUid = isCaller ? call.calleeUid : call.callerUid;
                return (
                  <div key={call.id} className="py-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/profile/${peerUid}`)}
                      className="min-w-0 text-left hover:underline"
                    >
                      <p className="text-sm font-medium truncate">{peerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {call.type === 'video' ? t.common.video : t.common.voice} · {call.status} ·{' '}
                        {LANGUAGE_LABELS[call.callerLang].codeLabel} ↔ {LANGUAGE_LABELS[call.calleeLang].codeLabel}
                      </p>
                    </button>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {formatDuration(call.durationSeconds || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AddFriendModal open={addFriendOpen} onClose={() => setAddFriendOpen(false)} />
      <SmartPhraseDrawer
        open={phraseDrawerOpen}
        onClose={() => setPhraseDrawerOpen(false)}
        defaultSourceLang={myLang}
        defaultTargetLang={partnerDefaultLang}
      />
    </div>
  );
};
