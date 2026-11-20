import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  clearCachedOAuthAccessToken,
  db,
  ensureUserAccountInitialized,
  getCachedOAuthAccessToken,
  getDefaultSettings,
  handleFirestoreError,
  OperationType,
  refreshContactsOAuthToken,
  reloadAndRefreshVerification,
  resendVerificationForCurrentUser,
  sendResetEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  testFirestoreConnection,
  updateUserSettings,
} from '../firebase';
import type {
  CallRecord,
  FriendRequest,
  Friendship,
  FriendView,
  LangCode,
  NotificationItem,
  PublicProfile,
  UserPrivate,
  UserSettings,
} from '../types';
import {
  getNotificationPermissionState,
  registerNotificationWorker,
  requestNotificationPermission,
  showBrowserNotification,
} from '../utils/notifications';

interface ToastMessage {
  id: string;
  kind: 'success' | 'error' | 'info';
  text: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  authReady: boolean;
  needsEmailVerification: boolean;
  lastAuthError: string | null;
  clearAuthError: () => void;
  privateUser: UserPrivate | null;
  publicProfile: PublicProfile | null;
  settings: UserSettings | null;
  firestoreOnline: boolean;
  oauthAccessToken: string | null;
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  friends: FriendView[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  callHistory: CallRecord[];
  notificationPermission: NotificationPermission | 'unsupported';
  toasts: ToastMessage[];
  pushToast: (kind: 'success' | 'error' | 'info', text: string) => void;
  dismissToast: (id: string) => void;
  loginWithGoogle: () => Promise<boolean>;
  signupWithGoogle: (preferredLanguage: LangCode, customHandle?: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  signupWithEmailAccount: (params: {
    email: string;
    password: string;
    displayName: string;
    preferredLanguage: LangCode;
    customHandle?: string;
  }) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string>;
  connectContactsToken: () => Promise<string | null>;
  enableNotifications: () => Promise<NotificationPermission | 'unsupported'>;
  toggleOnlinePresence: () => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

function sortDescByTime<T extends { createdAt?: unknown; startedAt?: unknown }>(items: T[]): T[] {
  const toMs = (val: unknown): number => {
    if (!val) return 0;
    if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
      return (val as { toMillis: () => number }).toMillis();
    }
    if (typeof val === 'number') return val;
    return 0;
  };
  return [...items].sort((a, b) => (toMs(b.createdAt ?? b.startedAt) - toMs(a.createdAt ?? a.startedAt)));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [privateUser, setPrivateUser] = useState<UserPrivate | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [firestoreOnline, setFirestoreOnline] = useState(true);
  const [oauthAccessToken, setOauthAccessToken] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friendshipsA, setFriendshipsA] = useState<Friendship[]>([]);
  const [friendshipsB, setFriendshipsB] = useState<Friendship[]>([]);
  const [friendPresenceMap, setFriendPresenceMap] = useState<Record<string, PublicProfile>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [callsAsCaller, setCallsAsCaller] = useState<CallRecord[]>([]);
  const [callsAsCallee, setCallsAsCallee] = useState<CallRecord[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    getNotificationPermissionState()
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);
  const [verifiedNonce, setVerifiedNonce] = useState(0);

  const pendingOnboardingRef = useRef<{ lang: LangCode; handle?: string } | null>(null);
  const initialNotifLoadedRef = useRef(false);
  const seenNotifIdsRef = useRef(new Set<string>());

  const clearAuthError = useCallback(() => setLastAuthError(null), []);

  const pushToast = useCallback((kind: 'success' | 'error' | 'info', text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Boot checks: Firestore connectivity + Service Worker registration
  useEffect(() => {
    void testFirestoreConnection().then((res) => {
      setFirestoreOnline(res.online);
      if (!res.online && res.message) {
        pushToast('error', res.message);
      }
    });
    void registerNotificationWorker();
  }, [pushToast]);

  // Apply theme to <html>
  useEffect(() => {
    const isDark = settings?.theme === 'dark';
    document.documentElement.classList.toggle('dark', Boolean(isDark));
  }, [settings?.theme]);

  const initializeVerifiedUser = useCallback(
    async (user: User) => {
      const onboarding = pendingOnboardingRef.current;
      pendingOnboardingRef.current = null;
      const initialized = await ensureUserAccountInitialized(
        user,
        onboarding?.lang ?? 'bn',
        onboarding?.handle
      );
      setPrivateUser(initialized.privateUser);
      setPublicProfile(initialized.publicProfile);
      setSettings(initialized.settings);
      setOauthAccessToken(getCachedOAuthAccessToken());

      if (getNotificationPermissionState() === 'default') {
        void requestNotificationPermission().then((perm) => {
          setNotificationPermission(perm);
          if (perm === 'granted') {
            void updateUserSettings(user.uid, { notificationsEnabled: true });
          }
        });
      }
    },
    []
  );

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        clearCachedOAuthAccessToken();
        setOauthAccessToken(null);
        setPrivateUser(null);
        setPublicProfile(null);
        setSettings(null);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setFriendshipsA([]);
        setFriendshipsB([]);
        setNotifications([]);
        setCallsAsCaller([]);
        setCallsAsCallee([]);
        initialNotifLoadedRef.current = false;
        seenNotifIdsRef.current.clear();
        setAuthReady(true);
        return;
      }

      // Wait until email is verified before touching Firestore (enforced by firestore.rules)
      if (!user.emailVerified) {
        setAuthReady(true);
        return;
      }

      try {
        await initializeVerifiedUser(user);
      } catch (err) {
        console.error('Initialization error:', err);
        pushToast('error', err instanceof Error ? err.message : 'Failed to initialize user profile.');
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [initializeVerifiedUser, pushToast]);

  // Real-time Firestore listeners (strictly attached only when authenticated & email-verified)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) return;
    const uid = firebaseUser.uid;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) setPrivateUser(snap.data() as UserPrivate);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'publicProfiles', uid),
        (snap) => {
          if (snap.exists()) setPublicProfile(snap.data() as PublicProfile);
        },
        (error) => handleFirestoreError(error, OperationType.GET, `publicProfiles/${uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'userSettings', uid),
        (snap) => {
          if (snap.exists()) {
            setSettings(snap.data() as UserSettings);
          } else {
            setSettings(getDefaultSettings(uid));
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `userSettings/${uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'friendRequests'), where('toUid', '==', uid)),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<FriendRequest, 'id'>) }))
            .filter((r) => r.status === 'pending');
          setIncomingRequests(sortDescByTime(list));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests(toUid)')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'friendRequests'), where('fromUid', '==', uid)),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<FriendRequest, 'id'>) }))
            .filter((r) => r.status === 'pending');
          setOutgoingRequests(sortDescByTime(list));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'friendRequests(fromUid)')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'friendships'), where('userA', '==', uid)),
        (snap) => {
          setFriendshipsA(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Friendship, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'friendships(userA)')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'friendships'), where('userB', '==', uid)),
        (snap) => {
          setFriendshipsB(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Friendship, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'friendships(userB)')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('toUid', '==', uid)),
        (snap) => {
          const items = sortDescByTime(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }))
          );
          if (!initialNotifLoadedRef.current) {
            initialNotifLoadedRef.current = true;
            items.forEach((n) => seenNotifIdsRef.current.add(n.id));
          } else {
            for (const n of items) {
              if (!seenNotifIdsRef.current.has(n.id)) {
                seenNotifIdsRef.current.add(n.id);
                if (!n.read && n.type !== 'call_incoming') {
                  void showBrowserNotification({
                    title: n.title,
                    body: n.body,
                    type: n.type,
                    tag: `notif-${n.id}`,
                    url: n.type === 'friend_request' ? '/' : `/profile/${n.fromUid}`,
                  });
                }
              }
            }
          }
          setNotifications(items);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'calls'), where('callerUid', '==', uid)),
        (snap) => {
          setCallsAsCaller(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CallRecord, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'calls(caller)')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'calls'), where('calleeUid', '==', uid)),
        (snap) => {
          setCallsAsCallee(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CallRecord, 'id'>) })));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'calls(callee)')
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser, verifiedNonce]);

  // Subscribe to friends' live PublicProfile (online status + preferred language updates)
  const friendUidsKey = React.useMemo(() => {
    if (!firebaseUser) return '';
    const uid = firebaseUser.uid;
    const ids = new Set<string>();
    for (const f of friendshipsA) ids.add(f.userA === uid ? f.userB : f.userA);
    for (const f of friendshipsB) ids.add(f.userA === uid ? f.userB : f.userA);
    return Array.from(ids).sort().join(',');
  }, [firebaseUser, friendshipsA, friendshipsB]);

  useEffect(() => {
    if (!friendUidsKey) {
      setFriendPresenceMap({});
      return;
    }
    const uids = friendUidsKey.split(',').filter(Boolean);
    const unsubs = uids.map((fUid) =>
      onSnapshot(
        doc(db, 'publicProfiles', fUid),
        (snap) => {
          if (snap.exists()) {
            setFriendPresenceMap((prev) => ({ ...prev, [fUid]: snap.data() as PublicProfile }));
          }
        },
        () => {
          // Ignore individual friend profile listener issues
        }
      )
    );
    return () => unsubs.forEach((fn) => fn());
  }, [friendUidsKey]);

  const friends: FriendView[] = React.useMemo(() => {
    if (!firebaseUser) return [];
    const uid = firebaseUser.uid;
    const all = [...friendshipsA, ...friendshipsB];
    const dedup = new Map<string, FriendView>();
    for (const f of all) {
      const isA = f.userA === uid;
      const friendUid = isA ? f.userB : f.userA;
      const liveProfile = friendPresenceMap[friendUid];
      dedup.set(friendUid, {
        friendshipId: f.id,
        uid: friendUid,
        displayName: liveProfile?.displayName || (isA ? f.userBName : f.userAName),
        photoURL: liveProfile?.photoURL || (isA ? f.userBPhoto : f.userAPhoto),
        handle: liveProfile?.handle || (isA ? f.userBHandle : f.userAHandle),
        preferredLanguage: liveProfile?.preferredLanguage || (isA ? f.userBLang : f.userALang),
        online: liveProfile?.online ?? false,
      });
    }
    return Array.from(dedup.values()).sort((a, b) => Number(Boolean(b.online)) - Number(Boolean(a.online)));
  }, [firebaseUser, friendshipsA, friendshipsB, friendPresenceMap]);

  const callHistory: CallRecord[] = React.useMemo(() => {
    const map = new Map<string, CallRecord>();
    for (const c of [...callsAsCaller, ...callsAsCallee]) {
      map.set(c.id, c);
    }
    return sortDescByTime(Array.from(map.values()));
  }, [callsAsCaller, callsAsCallee]);

  const formatAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    if (raw.includes('access_denied') || raw.includes('403') || raw.includes('auth/unauthorized-domain')) {
      return 'Google OAuth blocked this account because the GCP OAuth Consent Screen is in Testing mode. Add the Gmail address under Test Users in Google Cloud Console (APIs & Services > OAuth consent screen), or sign in using Email & Password.';
    }
    if (raw.includes('auth/popup-blocked')) {
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    }
    if (raw.includes('auth/popup-closed-by-user')) {
      return 'Google Sign-In popup was closed before finishing.';
    }
    if (raw.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication > Sign-in method). Enable Email/Password there or sign in with an approved Google Test User.';
    }
    if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found')) {
      return 'Invalid email address or password.';
    }
    if (raw.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (raw.includes('auth/weak-password')) {
      return 'Password must be at least 6 characters long.';
    }
    return raw;
  };

  const loginWithGoogle = useCallback(async () => {
    setLastAuthError(null);
    try {
      const { accessToken } = await signInWithGoogle();
      setOauthAccessToken(accessToken);
      return true;
    } catch (err) {
      const msg = formatAuthError(err);
      setLastAuthError(msg);
      pushToast('error', msg);
      return false;
    }
  }, [pushToast]);

  const signupWithGoogle = useCallback(
    async (preferredLanguage: LangCode, customHandle?: string) => {
      setLastAuthError(null);
      pendingOnboardingRef.current = { lang: preferredLanguage, handle: customHandle };
      try {
        const { accessToken } = await signInWithGoogle();
        setOauthAccessToken(accessToken);
        return true;
      } catch (err) {
        pendingOnboardingRef.current = null;
        const msg = formatAuthError(err);
        setLastAuthError(msg);
        pushToast('error', msg);
        return false;
      }
    },
    [pushToast]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setLastAuthError(null);
      try {
        await signInWithEmail(email, password);
        return true;
      } catch (err) {
        const msg = formatAuthError(err);
        setLastAuthError(msg);
        pushToast('error', msg);
        return false;
      }
    },
    [pushToast]
  );

  const signupWithEmailAccount = useCallback(
    async (params: {
      email: string;
      password: string;
      displayName: string;
      preferredLanguage: LangCode;
      customHandle?: string;
    }) => {
      setLastAuthError(null);
      pendingOnboardingRef.current = { lang: params.preferredLanguage, handle: params.customHandle };
      try {
        await signUpWithEmail(params.email, params.password, params.displayName);
        pushToast('success', 'Verification link sent to your email inbox.');
        return true;
      } catch (err) {
        pendingOnboardingRef.current = null;
        const msg = formatAuthError(err);
        setLastAuthError(msg);
        pushToast('error', msg);
        return false;
      }
    },
    [pushToast]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      setLastAuthError(null);
      try {
        await sendResetEmail(email);
        pushToast('success', 'Password reset email sent.');
        return true;
      } catch (err) {
        const msg = formatAuthError(err);
        setLastAuthError(msg);
        pushToast('error', msg);
        return false;
      }
    },
    [pushToast]
  );

  const resendVerificationEmail = useCallback(async () => {
    try {
      await resendVerificationForCurrentUser();
      pushToast('success', 'Verification email re-sent. Please check your inbox and spam folder.');
    } catch (err) {
      pushToast('error', formatAuthError(err));
    }
  }, [pushToast]);

  const checkEmailVerified = useCallback(async () => {
    try {
      const verified = await reloadAndRefreshVerification();
      if (verified && auth.currentUser) {
        await initializeVerifiedUser(auth.currentUser);
        setFirebaseUser(auth.currentUser);
        setVerifiedNonce((n) => n + 1);
        pushToast('success', 'Email verified successfully!');
        return true;
      }
      pushToast('info', 'Email is not verified yet. Please click the link sent to your inbox.');
      return false;
    } catch (err) {
      pushToast('error', formatAuthError(err));
      return false;
    }
  }, [initializeVerifiedUser, pushToast]);

  const logout = useCallback(async () => {
    await signOutUser();
    setOauthAccessToken(null);
    pushToast('info', 'Signed out cleanly.');
  }, [pushToast]);

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not authenticated.');
    return auth.currentUser.getIdToken();
  }, []);

  const connectContactsToken = useCallback(async () => {
    try {
      const token = await refreshContactsOAuthToken();
      setOauthAccessToken(token);
      return token;
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to connect Google Contacts.');
      return null;
    }
  }, [pushToast]);

  const enableNotifications = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (firebaseUser) {
      await updateUserSettings(firebaseUser.uid, { notificationsEnabled: perm === 'granted' });
    }
    if (perm === 'granted') {
      pushToast('success', 'Web push notifications enabled for incoming calls and friend requests.');
    } else if (perm === 'denied') {
      pushToast('error', 'Notifications blocked by browser settings. Enable them in site permissions.');
    }
    return perm;
  }, [firebaseUser, pushToast]);

  const toggleOnlinePresence = useCallback(async () => {
    if (!firebaseUser || !publicProfile) return;
    const nextOnline = !publicProfile.online;
    try {
      await updateDoc(doc(db, 'publicProfiles', firebaseUser.uid), {
        online: nextOnline,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `publicProfiles/${firebaseUser.uid}`);
    }
  }, [firebaseUser, publicProfile]);

  const toggleTheme = useCallback(async () => {
    if (!firebaseUser || !settings) return;
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    await updateUserSettings(firebaseUser.uid, { theme: nextTheme });
  }, [firebaseUser, settings]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const needsEmailVerification = Boolean(firebaseUser && !firebaseUser.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authReady,
        needsEmailVerification,
        lastAuthError,
        clearAuthError,
        privateUser,
        publicProfile,
        settings,
        firestoreOnline,
        oauthAccessToken,
        incomingRequests,
        outgoingRequests,
        friends,
        notifications,
        unreadNotificationsCount,
        callHistory,
        notificationPermission,
        toasts,
        pushToast,
        dismissToast,
        loginWithGoogle,
        signupWithGoogle,
        loginWithEmail,
        signupWithEmailAccount,
        sendPasswordReset,
        resendVerificationEmail,
        checkEmailVerified,
        logout,
        getIdToken,
        connectContactsToken,
        enableNotifications,
        toggleOnlinePresence,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
