import React, { useState } from 'react';
import { Check, Loader2, Mail, Search, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { resolveUserByEmailOrHandle, respondToFriendRequest, sendFriendRequestToUser } from '../firebase';
import { GoogleContactItem, LANGUAGE_LABELS } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AddFriendModal: React.FC<Props> = ({ open, onClose }) => {
  const {
    privateUser,
    oauthAccessToken,
    connectContactsToken,
    pushToast,
    friends,
    outgoingRequests,
    incomingRequests,
  } = useAuth();
  const { t } = useI18n();
  const [gmailInput, setGmailInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    uid: string;
    displayName: string;
    photoURL?: string;
    handle: string;
    preferredLanguage: 'bn' | 'id';
  } | null>(null);
  const [notFoundEmail, setNotFoundEmail] = useState('');
  const [sendingUid, setSendingUid] = useState<string | null>(null);

  const [contactsLoading, setContactsLoading] = useState(false);
  const [contacts, setContacts] = useState<GoogleContactItem[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);

  if (!open) return null;

  const isAlreadyFriendOrPending = (uid: string) =>
    friends.some((f) => f.uid === uid) || outgoingRequests.some((r) => r.toUid === uid);

  const handleLookupByGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = gmailInput.trim();
    if (!query) return;
    setSearching(true);
    setFoundUser(null);
    setNotFoundEmail('');
    try {
      const result = await resolveUserByEmailOrHandle(query);
      if (!result) {
        setNotFoundEmail(query);
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
    if (!privateUser) return;
    setSendingUid(target.uid);
    try {
      await sendFriendRequestToUser(privateUser, target);
      pushToast('success', `${target.displayName} — ${t.addFriend.sendRequest}`);
      setFoundUser(null);
      setGmailInput('');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Could not send friend request.');
    } finally {
      setSendingUid(null);
    }
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401 || res.status === 403) {
        token = await connectContactsToken();
        if (!token) throw new Error('Google Contacts authorization is required.');
        const retry = await fetch(
          'https://people.googleapis.com/v1/people/me/connections?pageSize=50&personFields=names,emailAddresses,photos',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!retry.ok) throw new Error('Unable to read Google Contacts.');
        const retryData = await retry.json();
        parseContacts(retryData);
        return;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || 'Google People API request failed.');
      }
      const data = await res.json();
      parseContacts(data);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to load Google Contacts.');
    } finally {
      setContactsLoading(false);
    }
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

  const handleInviteContactEmail = async (contact: GoogleContactItem) => {
    setSearching(true);
    setNotFoundEmail('');
    try {
      const resolved = await resolveUserByEmailOrHandle(contact.email);
      if (!resolved) {
        setNotFoundEmail(contact.email);
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

  const copyMyProfileLink = async () => {
    if (!privateUser) return;
    const url = `${window.location.origin}/profile/${privateUser.uid}`;
    await navigator.clipboard.writeText(url);
    pushToast('success', t.common.copied);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold font-display">{t.addFriend.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleLookupByGmail} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t.addFriend.enterGmail}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  placeholder="friend@gmail.com or @handle"
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
            </div>
          </form>

          {foundUser && (() => {
            const incomingFromFound = incomingRequests.find((r) => r.fromUid === foundUser.uid);
            return (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-4">
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
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {foundUser.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      @{foundUser.handle} · {LANGUAGE_LABELS[foundUser.preferredLanguage].name}
                    </p>
                  </div>
                </div>
                {incomingFromFound && privateUser ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await respondToFriendRequest(incomingFromFound, privateUser, 'accepted');
                        pushToast('success', `${foundUser.displayName} — ${t.common.accept}`);
                        setFoundUser(null);
                        setGmailInput('');
                      }}
                      className="min-h-[38px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      {t.common.accept}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await respondToFriendRequest(incomingFromFound, privateUser, 'rejected');
                        pushToast('info', `${foundUser.displayName} — ${t.common.decline}`);
                        setFoundUser(null);
                      }}
                      className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      {t.common.decline}
                    </button>
                  </div>
                ) : isAlreadyFriendOrPending(foundUser.uid) ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    <Check className="w-4 h-4" />
                    {t.addFriend.connectedOrPending}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendInvite(foundUser)}
                    disabled={sendingUid === foundUser.uid}
                    className="min-h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium whitespace-nowrap shrink-0"
                  >
                    {sendingUid === foundUser.uid ? t.addFriend.sending : t.addFriend.sendRequest}
                  </button>
                )}
              </div>
            );
          })()}

          {notFoundEmail && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {notFoundEmail} {t.addFriend.notRegisteredTitle}
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

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
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
                className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                {contactsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {contactsLoaded ? t.addFriend.refreshContacts : t.addFriend.loadContacts}
              </button>
            </div>

            {contactsLoaded && contacts.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                {t.addFriend.noContacts}
              </p>
            )}

            {contacts.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-56 overflow-y-auto">
                {contacts.map((c) => (
                  <div key={c.resourceName} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInviteContactEmail(c)}
                      className="min-h-[36px] px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium whitespace-nowrap shrink-0"
                    >
                      {t.addFriend.checkAndInvite}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
