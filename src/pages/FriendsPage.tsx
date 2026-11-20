import React, { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useI18n } from '../context/I18nContext';
import {
  cancelOutgoingFriendRequest,
  resolveUserByEmailOrHandle,
  respondToFriendRequest,
  sendFriendRequestToUser,
} from '../firebase';
import { FriendView, GoogleContactItem, LANGUAGE_LABELS, LangCode } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

export const FriendsPage: React.FC<Props> = ({ onNavigate }) => {
  const {
    privateUser,
    friends,
    incomingRequests,
    outgoingRequests,
    oauthAccessToken,
    connectContactsToken,
    pushToast,
  } = useAuth();
  const { startCall } = useCall();
  const { t } = useI18n();

  const [queryInput, setQueryInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    uid: string;
    displayName: string;
    photoURL?: string;
    handle: string;
    preferredLanguage: LangCode;
  } | null>(null);
  const [notFoundQuery, setNotFoundQuery] = useState('');
  const [sendingUid, setSendingUid] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const [contactsLoading, setContactsLoading] = useState(false);
  const [contacts, setContacts] = useState<GoogleContactItem[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);

  if (!privateUser) return null;

  const isFriend = (uid: string) => friends.some((f) => f.uid === uid);
  const isOutgoingPending = (uid: string) => outgoingRequests.some((r) => r.toUid === uid);
  const matchingIncoming = (uid: string) => incomingRequests.find((r) => r.fromUid === uid);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = queryInput.trim();
    if (!cleaned) return;
    setSearching(true);
    setFoundUser(null);
    setNotFoundQuery('');
    try {
      const result = await resolveUserByEmailOrHandle(cleaned);
      if (!result) {
        setNotFoundQuery(cleaned);
      } else {
        setFoundUser(result);
      }
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendInvite = async (target: {
    uid: string;
    displayName: string;
    photoURL?: string;
    handle: string;
  }) => {
    setSendingUid(target.uid);
    try {
      await sendFriendRequestToUser(privateUser, target);
      pushToast('success', `${target.displayName} — ${t.addFriend.sendRequest}`);
      setFoundUser(null);
      setQueryInput('');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Could not send friend request.');
    } finally {
      setSendingUid(null);
    }
  };

  const handleRespond = async (reqId: string, decision: 'accepted' | 'rejected') => {
    const req = incomingRequests.find((r) => r.id === reqId);
    if (!req) return;
    setRespondingId(reqId);
    try {
      await respondToFriendRequest(req, privateUser, decision);
      pushToast(
        'success',
        decision === 'accepted' ? `${req.fromName} — ${t.common.accept}` : `${req.fromName} — ${t.common.decline}`
      );
      if (foundUser?.uid === req.fromUid) {
        setFoundUser(null);
      }
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleCancelOutgoing = async (reqId: string, toName: string) => {
    setCancelingId(reqId);
    try {
      await cancelOutgoingFriendRequest(reqId);
      pushToast('info', `${toName} — ${t.friendsPage.cancelRequest}`);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to cancel request.');
    } finally {
      setCancelingId(null);
    }
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

  const copyMyProfileLink = async () => {
    const url = `${window.location.origin}/profile/${privateUser.uid}`;
    await navigator.clipboard.writeText(url);
    pushToast('success', t.common.copied);
  };

  const parseContacts = (data: {
    connections?: Array<{
      resourceName?: string;
      names?: Array<{ displayName?: string }>;
      emailAddresses?: Array<{ value?: string }>;
      photos?: Array<{ url?: string }>;
    }>;
  }) => {
    const parsed: GoogleContactItem[] = [];
    for (const person of data.connections || []) {
      const email = person.emailAddresses?.[0]?.value?.trim().toLowerCase();
      if (!email) continue;
      parsed.push({
        resourceName: person.resourceName || email,
        name: person.names?.[0]?.displayName || email.split('@')[0],
        email,
        photoURL: person.photos?.[0]?.url,
      });
    }
    setContacts(parsed);
    setContactsLoaded(true);
  };

  const handleImportGoogleContacts = async () => {
    setContactsLoading(true);
    try {
      let token = oauthAccessToken;
      if (!token) {
        token = await connectContactsToken();
      }
      if (!token) {
        setContactsLoading(false);
        return;
      }

      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?pageSize=50&personFields=names,emailAddresses,photos',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401 || res.status === 403) {
        token = await connectContactsToken();
        if (!token) throw new Error('Google Contacts authorization is required.');
        const retry = await fetch(
          'https://people.googleapis.com/v1/people/me/connections?pageSize=50&personFields=names,emailAddresses,photos',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!retry.ok) throw new Error('Unable to read Google Contacts.');
        parseContacts(await retry.json());
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || 'Google People API request failed.');
      }
      parseContacts(await res.json());
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to load Google Contacts.');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleInviteContactEmail = async (contact: GoogleContactItem) => {
    setSearching(true);
    setNotFoundQuery('');
    try {
      const resolved = await resolveUserByEmailOrHandle(contact.email);
      if (!resolved) {
        setNotFoundQuery(contact.email);
        pushToast('info', `${contact.name} (${contact.email}) ${t.addFriend.notRegisteredTitle}`);
      } else {
        await handleSendInvite(resolved);
      }
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to send invite.');
    } finally {
      setSearching(false);
    }
  };

  const incomingFromFound = foundUser ? matchingIncoming(foundUser.uid) : undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">{t.friendsPage.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.friendsPage.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={copyMyProfileLink}
          className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Copy className="w-3.5 h-3.5" />
          {t.dashboard.copyMyLink}
        </button>
      </div>

      {/* Top Two-Column Workspace: Dedicated Send Request + Dedicated Incoming Requests */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Send Friend Request Card */}
        <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div>
            <h2 className="font-display font-semibold text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.friendsPage.sendCardTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.friendsPage.sendCardDesc}
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={t.friendsPage.sendPlaceholder}
                className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t.addFriend.find}
            </button>
          </form>

          {foundUser && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {foundUser.photoURL ? (
                  <img
                    src={foundUser.photoURL}
                    alt={foundUser.displayName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold shrink-0">
                    {foundUser.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{foundUser.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    @{foundUser.handle} · {LANGUAGE_LABELS[foundUser.preferredLanguage].name}
                  </p>
                </div>
              </div>

              {foundUser.uid === privateUser.uid ? null : incomingFromFound ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={respondingId === incomingFromFound.id}
                    onClick={() => void handleRespond(incomingFromFound.id, 'accepted')}
                    className="min-h-[38px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t.common.accept}
                  </button>
                  <button
                    type="button"
                    disabled={respondingId === incomingFromFound.id}
                    onClick={() => void handleRespond(incomingFromFound.id, 'rejected')}
                    className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    {t.common.decline}
                  </button>
                </div>
              ) : isFriend(foundUser.uid) || isOutgoingPending(foundUser.uid) ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4" />
                  {t.addFriend.connectedOrPending}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSendInvite(foundUser)}
                  disabled={sendingUid === foundUser.uid}
                  className="min-h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {sendingUid === foundUser.uid ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  {sendingUid === foundUser.uid ? t.addFriend.sending : t.friendsPage.sendBtn}
                </button>
              )}
            </div>
          )}

          {notFoundQuery && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {notFoundQuery} {t.addFriend.notRegisteredTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.addFriend.notRegisteredDesc}
              </p>
              <button
                type="button"
                onClick={copyMyProfileLink}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {t.addFriend.copyShareLink}
              </button>
            </div>
          )}

          {/* Google Contacts Importer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {t.addFriend.importContactsTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.addFriend.importContactsDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleImportGoogleContacts}
                disabled={contactsLoading}
                className="min-h-[38px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                {contactsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {contactsLoaded ? t.addFriend.refreshContacts : t.addFriend.loadContacts}
              </button>
            </div>

            {contactsLoaded && contacts.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">{t.addFriend.noContacts}</p>
            )}

            {contacts.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-52 overflow-y-auto">
                {contacts.map((c) => (
                  <div key={c.resourceName} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleInviteContactEmail(c)}
                      className="min-h-[34px] px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap shrink-0"
                    >
                      {t.addFriend.checkAndInvite}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dedicated Incoming Friend Requests Card (ALWAYS Visible) */}
        <section className="lg:col-span-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {t.friendsPage.incomingTitle} ({incomingRequests.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.friendsPage.incomingDesc}
              </p>
            </div>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-8 px-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.friendsPage.incomingEmpty}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {req.fromPhoto ? (
                      <img
                        src={req.fromPhoto}
                        alt={req.fromName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold shrink-0">
                        {req.fromName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{req.fromName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        @{req.fromHandle} · {LANGUAGE_LABELS[req.fromLang].native}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/profile/${req.fromUid}`)}
                      className="min-h-[38px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t.friendsPage.viewProfile}
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === req.id}
                      onClick={() => void handleRespond(req.id, 'accepted')}
                      className="min-h-[38px] px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {respondingId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {t.common.accept}
                    </button>
                    <button
                      type="button"
                      disabled={respondingId === req.id}
                      onClick={() => void handleRespond(req.id, 'rejected')}
                      aria-label={t.common.decline}
                      className="min-h-[38px] px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Outgoing Pending Requests inside the same column */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t.friendsPage.outgoingTitle} ({outgoingRequests.length})
            </h3>
            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.friendsPage.outgoingEmpty}</p>
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <button
                      type="button"
                      onClick={() => onNavigate(`/profile/${req.toUid}`)}
                      className="min-w-0 text-left hover:underline"
                    >
                      <p className="text-sm font-medium truncate">{req.toName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{req.toHandle}</p>
                    </button>
                    <button
                      type="button"
                      disabled={cancelingId === req.id}
                      onClick={() => void handleCancelOutgoing(req.id, req.toName)}
                      className="min-h-[34px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-red-600 dark:text-red-400 shrink-0 disabled:opacity-50"
                    >
                      {t.friendsPage.cancelRequest}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Connected Friends List */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t.friendsPage.connectedTitle} ({friends.length})
          </h2>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 px-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.friendsPage.connectedEmpty}</p>
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
                    <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-semibold shrink-0">
                      {friend.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {friend.online ? t.common.online : t.common.offline} ·{' '}
                      {LANGUAGE_LABELS[friend.preferredLanguage].native} · @{friend.handle}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => void handleCallFriend(friend, 'voice')}
                    className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {t.common.voice}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCallFriend(friend, 'video')}
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
      </section>
    </div>
  );
};
