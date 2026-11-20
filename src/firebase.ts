import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type {
  CallRecord,
  CallType,
  FriendRequest,
  LangCode,
  NotificationItem,
  PublicProfile,
  UserPrivate,
  UserSettings,
  VoiceName,
} from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const GOOGLE_CONTACTS_SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
];

const loginProvider = new GoogleAuthProvider();
loginProvider.setCustomParameters({ prompt: 'select_account' });

const contactsProvider = new GoogleAuthProvider();
for (const scope of GOOGLE_CONTACTS_SCOPES) {
  contactsProvider.addScope(scope);
}
contactsProvider.setCustomParameters({ prompt: 'consent select_account' });

// In-memory OAuth access token cache (never stored in localStorage/sessionStorage)
let cachedOAuthAccessToken: string | null = null;

export function getCachedOAuthAccessToken(): string | null {
  return cachedOAuthAccessToken;
}

export function clearCachedOAuthAccessToken(): void {
  cachedOAuthAccessToken = null;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<{ online: boolean; message?: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { online: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return { online: false, message: 'Firestore client is offline.' };
    }
    // Permission error on test/connection still confirms live server connectivity
    return { online: true };
  }
}

export async function signInWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
  const result = await signInWithPopup(auth, loginProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedOAuthAccessToken = credential?.accessToken ?? null;
  return { user: result.user, accessToken: cachedOAuthAccessToken };
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim().slice(0, 100) });
  }
  await sendEmailVerification(result.user);
  return result.user;
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerificationForCurrentUser(): Promise<void> {
  if (!auth.currentUser) throw new Error('No active user session.');
  await sendEmailVerification(auth.currentUser);
}

export async function reloadAndRefreshVerification(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  return Boolean(auth.currentUser.emailVerified);
}

export async function refreshContactsOAuthToken(): Promise<string | null> {
  const current = auth.currentUser;
  if (current?.email) {
    contactsProvider.setCustomParameters({
      prompt: 'consent select_account',
      login_hint: current.email,
    });
  }
  const result = current
    ? await reauthenticateWithPopup(current, contactsProvider)
    : await signInWithPopup(auth, contactsProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  cachedOAuthAccessToken = credential?.accessToken ?? null;
  return cachedOAuthAccessToken;
}

export async function signOutUser(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await updateDoc(doc(db, 'publicProfiles', uid), {
        online: false,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignore presence update error on sign-out
    }
  }
  cachedOAuthAccessToken = null;
  await signOut(auth);
}

export async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const encoded = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function sanitizeHandle(raw: string, fallbackUid: string): string {
  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  if (clean.length >= 2) return clean;
  return `user-${fallbackUid.slice(0, 8).toLowerCase()}`;
}

export function getDefaultSettings(uid: string): UserSettings {
  return {
    uid,
    autoTranslate: true,
    defaultAudioMode: 'translated',
    captionsEnabled: true,
    saveTranscripts: false,
    notificationsEnabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
    autoDetectLanguage: false,
    dialectNote: 'Standard Dhaka/Kolkata Bangla ↔ Standard Jakarta Indonesian',
    theme: 'light',
  };
}

export async function ensureUserAccountInitialized(
  user: User,
  preferredLanguage: LangCode = 'bn',
  customHandle?: string
): Promise<{ privateUser: UserPrivate; publicProfile: PublicProfile; settings: UserSettings; isNew: boolean }> {
  const uid = user.uid;
  const userRef = doc(db, 'users', uid);
  const publicRef = doc(db, 'publicProfiles', uid);
  const settingsRef = doc(db, 'userSettings', uid);

  let existingUserSnap;
  try {
    existingUserSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  const email = (user.email || '').trim().toLowerCase();
  const displayName = (user.displayName || email.split('@')[0] || 'LinguaConnect User').slice(0, 100);
  const photoURL = (user.photoURL || '').slice(0, 1024);

  if (existingUserSnap.exists()) {
    const privateUser = existingUserSnap.data() as UserPrivate;
    const publicSnap = await getDoc(publicRef);
    const settingsSnap = await getDoc(settingsRef);

    const publicProfile: PublicProfile = publicSnap.exists()
      ? (publicSnap.data() as PublicProfile)
      : {
          uid,
          displayName: privateUser.displayName,
          photoURL: privateUser.photoURL,
          handle: privateUser.handle,
          preferredLanguage: privateUser.preferredLanguage,
          voiceName: privateUser.voiceName,
          bio: '',
          online: true,
        };

    // Ensure publicProfile & handle exist, then mark user online
    try {
      if (!publicSnap.exists()) {
        await setDoc(publicRef, {
          uid,
          displayName: privateUser.displayName,
          photoURL: privateUser.photoURL || '',
          handle: privateUser.handle,
          preferredLanguage: privateUser.preferredLanguage,
          voiceName: privateUser.voiceName,
          bio: '',
          online: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(publicRef, {
          online: true,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `publicProfiles/${uid}`);
    }

    // Ensure handle reservation exists
    try {
      const handleRef = doc(db, 'handles', privateUser.handle);
      const handleSnap = await getDoc(handleRef);
      if (!handleSnap.exists()) {
        await setDoc(handleRef, {
          uid,
          handle: privateUser.handle,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      // Non-fatal if handle already reserved
    }

    // Ensure emailIndex exists for Gmail friend lookup
    if (email) {
      const emailHash = await hashEmail(email);
      try {
        await setDoc(doc(db, 'emailIndex', emailHash), {
          uid,
          displayName: privateUser.displayName,
          photoURL: privateUser.photoURL || '',
          handle: privateUser.handle,
          preferredLanguage: privateUser.preferredLanguage,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Non-fatal if already up-to-date
      }
    }

    const settings = settingsSnap.exists()
      ? (settingsSnap.data() as UserSettings)
      : getDefaultSettings(uid);

    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, { ...settings, updatedAt: serverTimestamp() });
    }

    return { privateUser, publicProfile: { ...publicProfile, online: true }, settings, isNew: false };
  }

  // First-time Google user setup
  let handle = sanitizeHandle(customHandle || email.split('@')[0] || displayName, uid);
  const handleSnap = await getDoc(doc(db, 'handles', handle));
  if (handleSnap.exists() && handleSnap.data()?.uid !== uid) {
    handle = `${handle.slice(0, 36)}-${uid.slice(0, 5).toLowerCase()}`;
  }

  const voiceName: VoiceName = 'Zephyr';
  const batch = writeBatch(db);

  const privatePayload: Record<string, unknown> = {
    uid,
    email,
    displayName,
    photoURL,
    handle,
    preferredLanguage,
    voiceName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const publicPayload: Record<string, unknown> = {
    uid,
    displayName,
    photoURL,
    handle,
    preferredLanguage,
    voiceName,
    bio: '',
    online: true,
    lastSeen: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const settingsDefaults = getDefaultSettings(uid);

  batch.set(userRef, privatePayload);
  batch.set(publicRef, publicPayload);
  batch.set(doc(db, 'handles', handle), {
    uid,
    handle,
    createdAt: serverTimestamp(),
  });
  batch.set(settingsRef, { ...settingsDefaults, updatedAt: serverTimestamp() });

  if (email) {
    const emailHash = await hashEmail(email);
    batch.set(doc(db, 'emailIndex', emailHash), {
      uid,
      displayName,
      photoURL,
      handle,
      preferredLanguage,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }

  return {
    privateUser: {
      uid,
      email,
      displayName,
      photoURL,
      handle,
      preferredLanguage,
      voiceName,
    },
    publicProfile: {
      uid,
      displayName,
      photoURL,
      handle,
      preferredLanguage,
      voiceName,
      bio: '',
      online: true,
    },
    settings: settingsDefaults,
    isNew: true,
  };
}

export async function updateProfileAndLanguage(
  currentUser: UserPrivate,
  updates: {
    displayName?: string;
    preferredLanguage?: LangCode;
    voiceName?: VoiceName;
    bio?: string;
    handle?: string;
  }
): Promise<{ handleChanged: boolean; newHandle: string }> {
  const uid = currentUser.uid;
  const nextDisplayName = (updates.displayName ?? currentUser.displayName).trim().slice(0, 100);
  const nextLang = updates.preferredLanguage ?? currentUser.preferredLanguage;
  const nextVoice = updates.voiceName ?? currentUser.voiceName;
  const nextBio = (updates.bio ?? '').trim().slice(0, 280);

  let nextHandle = currentUser.handle;
  let handleChanged = false;
  if (updates.handle && updates.handle !== currentUser.handle) {
    const candidate = sanitizeHandle(updates.handle, uid);
    const existingHandle = await getDoc(doc(db, 'handles', candidate));
    if (existingHandle.exists() && existingHandle.data()?.uid !== uid) {
      throw new Error(`Profile URL "@${candidate}" is already claimed by another user.`);
    }
    nextHandle = candidate;
    handleChanged = true;
  }

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid), {
    displayName: nextDisplayName,
    handle: nextHandle,
    preferredLanguage: nextLang,
    voiceName: nextVoice,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'publicProfiles', uid), {
    displayName: nextDisplayName,
    handle: nextHandle,
    preferredLanguage: nextLang,
    voiceName: nextVoice,
    bio: nextBio,
    updatedAt: serverTimestamp(),
  });

  if (handleChanged) {
    batch.set(doc(db, 'handles', nextHandle), {
      uid,
      handle: nextHandle,
      createdAt: serverTimestamp(),
    });
    batch.delete(doc(db, 'handles', currentUser.handle));
  }

  if (currentUser.email) {
    const emailHash = await hashEmail(currentUser.email);
    batch.set(doc(db, 'emailIndex', emailHash), {
      uid,
      displayName: nextDisplayName,
      photoURL: currentUser.photoURL || '',
      handle: nextHandle,
      preferredLanguage: nextLang,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }

  return { handleChanged, newHandle: nextHandle };
}

export async function updateUserSettings(uid: string, partial: Partial<UserSettings>): Promise<void> {
  const ref = doc(db, 'userSettings', uid);
  const snap = await getDoc(ref);
  const base = snap.exists() ? (snap.data() as UserSettings) : getDefaultSettings(uid);
  const merged = {
    uid,
    autoTranslate: partial.autoTranslate ?? base.autoTranslate,
    defaultAudioMode: partial.defaultAudioMode ?? base.defaultAudioMode,
    captionsEnabled: partial.captionsEnabled ?? base.captionsEnabled,
    saveTranscripts: partial.saveTranscripts ?? base.saveTranscripts,
    notificationsEnabled: partial.notificationsEnabled ?? base.notificationsEnabled,
    autoDetectLanguage: partial.autoDetectLanguage ?? base.autoDetectLanguage,
    dialectNote: (partial.dialectNote ?? base.dialectNote ?? '').slice(0, 200),
    theme: partial.theme ?? base.theme,
    updatedAt: serverTimestamp(),
  };
  try {
    await setDoc(ref, merged);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `userSettings/${uid}`);
  }
}

export async function resolveUserByEmail(email: string): Promise<{
  uid: string;
  displayName: string;
  photoURL?: string;
  handle: string;
  preferredLanguage: LangCode;
} | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Please enter a valid Gmail address.');
  }
  const emailHash = await hashEmail(normalized);
  try {
    const snap = await getDoc(doc(db, 'emailIndex', emailHash));
    if (!snap.exists()) return null;
    return snap.data() as {
      uid: string;
      displayName: string;
      photoURL?: string;
      handle: string;
      preferredLanguage: LangCode;
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `emailIndex/${emailHash}`);
  }
}

export async function resolveProfileByUidOrHandle(uidOrHandle: string): Promise<PublicProfile | null> {
  const clean = uidOrHandle.trim();
  if (!clean) return null;

  // Try direct UID lookup first
  try {
    const directSnap = await getDoc(doc(db, 'publicProfiles', clean));
    if (directSnap.exists()) return directSnap.data() as PublicProfile;
  } catch {
    // Fallback to handle lookup
  }

  // Try handle lookup
  const slug = clean.toLowerCase();
  try {
    const handleSnap = await getDoc(doc(db, 'handles', slug));
    if (!handleSnap.exists()) return null;
    const uid = handleSnap.data()?.uid as string;
    if (!uid) return null;
    const profileSnap = await getDoc(doc(db, 'publicProfiles', uid));
    return profileSnap.exists() ? (profileSnap.data() as PublicProfile) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `handles/${slug}`);
  }
}

export async function resolveUserByEmailOrHandle(input: string): Promise<{
  uid: string;
  displayName: string;
  photoURL?: string;
  handle: string;
  preferredLanguage: LangCode;
} | null> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Please enter an email address or @handle.');
  }
  if (trimmed.includes('@') && !trimmed.startsWith('@')) {
    return resolveUserByEmail(trimmed);
  }
  const slug = trimmed.replace(/^@+/, '').toLowerCase();
  if (!/^[a-z0-9_-]{2,48}$/.test(slug)) {
    throw new Error('Enter a valid email address or @handle (letters, numbers, hyphens, underscores).');
  }
  try {
    const handleSnap = await getDoc(doc(db, 'handles', slug));
    if (!handleSnap.exists()) return null;
    const uid = handleSnap.data()?.uid as string;
    if (!uid) return null;
    const profileSnap = await getDoc(doc(db, 'publicProfiles', uid));
    if (!profileSnap.exists()) return null;
    const p = profileSnap.data() as PublicProfile;
    return {
      uid: p.uid,
      displayName: p.displayName,
      photoURL: p.photoURL,
      handle: p.handle,
      preferredLanguage: p.preferredLanguage,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `handles/${slug}`);
  }
}

export async function sendFriendRequestToUser(
  sender: UserPrivate,
  target: { uid: string; displayName: string; photoURL?: string; handle: string }
): Promise<string> {
  if (sender.uid === target.uid) {
    throw new Error('You cannot send a friend request to yourself.');
  }

  const friendshipId = [sender.uid, target.uid].sort().join('_');
  let existingFriend;
  try {
    existingFriend = await getDoc(doc(db, 'friendships', friendshipId));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `friendships/${friendshipId}`);
  }
  if (existingFriend.exists()) {
    throw new Error(`${target.displayName} is already in your friends list.`);
  }

  const requestId = `${sender.uid}_${target.uid}`;
  let existingReq;
  try {
    existingReq = await getDoc(doc(db, 'friendRequests', requestId));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `friendRequests/${requestId}`);
  }
  if (existingReq.exists()) {
    const st = existingReq.data()?.status;
    if (st === 'pending') {
      throw new Error(`A friend request to ${target.displayName} is already pending.`);
    }
    if (st === 'rejected' || st === 'accepted') {
      try {
        await deleteDoc(doc(db, 'friendRequests', requestId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `friendRequests/${requestId}`);
      }
    }
  }

  const reverseRequestId = `${target.uid}_${sender.uid}`;
  try {
    const reverseReq = await getDoc(doc(db, 'friendRequests', reverseRequestId));
    if (reverseReq.exists() && reverseReq.data()?.status === 'pending') {
      throw new Error(
        `${target.displayName} already sent you a friend request! Accept it in Incoming Requests.`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('already sent you')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.GET, `friendRequests/${reverseRequestId}`);
  }

  const safeFromHandle = sanitizeHandle(sender.handle, sender.uid);
  const safeToHandle = sanitizeHandle(target.handle || target.displayName, target.uid);

  const batch = writeBatch(db);
  batch.set(doc(db, 'friendRequests', requestId), {
    fromUid: sender.uid,
    fromName: (sender.displayName || 'LinguaConnect User').slice(0, 100),
    fromPhoto: (sender.photoURL || '').slice(0, 1024),
    fromHandle: safeFromHandle,
    fromLang: sender.preferredLanguage === 'id' ? 'id' : 'bn',
    toUid: target.uid,
    toName: (target.displayName || 'LinguaConnect User').slice(0, 100),
    toPhoto: (target.photoURL || '').slice(0, 1024),
    toHandle: safeToHandle,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const notifRef = doc(collection(db, 'notifications'));
  batch.set(notifRef, {
    toUid: target.uid,
    fromUid: sender.uid,
    fromName: (sender.displayName || 'LinguaConnect User').slice(0, 100),
    fromPhoto: (sender.photoURL || '').slice(0, 1024),
    type: 'friend_request',
    title: 'New Friend Request',
    body: `${sender.displayName} sent you a friend request on LinguaConnect AI.`,
    callType: 'none',
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return requestId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `friendRequests/${requestId}`);
  }
}

export async function cancelOutgoingFriendRequest(requestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `friendRequests/${requestId}`);
  }
}

export async function respondToFriendRequest(
  req: FriendRequest,
  recipientProfile: UserPrivate,
  decision: 'accepted' | 'rejected'
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'friendRequests', req.id), {
    status: decision,
    updatedAt: serverTimestamp(),
  });

  if (decision === 'accepted') {
    const [uA, uB] = [req.fromUid, recipientProfile.uid].sort();
    const isSenderA = uA === req.fromUid;
    const friendshipId = `${uA}_${uB}`;
    batch.set(doc(db, 'friendships', friendshipId), {
      userA: uA,
      userB: uB,
      userAName: isSenderA ? req.fromName : recipientProfile.displayName,
      userBName: isSenderA ? recipientProfile.displayName : req.fromName,
      userAPhoto: (isSenderA ? req.fromPhoto : recipientProfile.photoURL) || '',
      userBPhoto: (isSenderA ? recipientProfile.photoURL : req.fromPhoto) || '',
      userAHandle: isSenderA ? req.fromHandle : recipientProfile.handle,
      userBHandle: isSenderA ? recipientProfile.handle : req.fromHandle,
      userALang: isSenderA ? req.fromLang : recipientProfile.preferredLanguage,
      userBLang: isSenderA ? recipientProfile.preferredLanguage : req.fromLang,
      createdAt: serverTimestamp(),
    });

    const notifRef = doc(collection(db, 'notifications'));
    batch.set(notifRef, {
      toUid: req.fromUid,
      fromUid: recipientProfile.uid,
      fromName: recipientProfile.displayName,
      fromPhoto: recipientProfile.photoURL || '',
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      body: `${recipientProfile.displayName} accepted your friend request. You can now call each other directly.`,
      callType: 'none',
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `friendRequests/${req.id}`);
  }
}

export async function createCallInFirestore(params: {
  caller: UserPrivate;
  callee: { uid: string; displayName: string; photoURL?: string; preferredLanguage: LangCode };
  type: CallType;
}): Promise<string> {
  const { caller, callee, type } = params;
  const callRef = doc(collection(db, 'calls'));
  const notifRef = doc(collection(db, 'notifications'));

  const batch = writeBatch(db);
  batch.set(callRef, {
    callerUid: caller.uid,
    callerName: caller.displayName,
    callerPhoto: caller.photoURL || '',
    callerLang: caller.preferredLanguage,
    calleeUid: callee.uid,
    calleeName: callee.displayName,
    calleePhoto: callee.photoURL || '',
    calleeLang: callee.preferredLanguage,
    type,
    status: 'ringing',
    startedAt: serverTimestamp(),
    durationSeconds: 0,
    updatedAt: serverTimestamp(),
  });

  batch.set(notifRef, {
    toUid: callee.uid,
    fromUid: caller.uid,
    fromName: caller.displayName,
    fromPhoto: caller.photoURL || '',
    type: 'call_incoming',
    title: type === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call',
    body: `${caller.displayName} is calling you with real-time AI translation.`,
    callId: callRef.id,
    callType: type,
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return callRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `calls/${callRef.id}`);
  }
}

export async function updateCallStatusInFirestore(
  callId: string,
  status: 'active' | 'ended' | 'missed' | 'rejected',
  durationSeconds?: number
): Promise<void> {
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'ended' || status === 'missed' || status === 'rejected') {
    payload.endedAt = serverTimestamp();
  }
  if (status === 'ended' && typeof durationSeconds === 'number') {
    payload.durationSeconds = Math.max(0, Math.round(durationSeconds));
  }
  try {
    await updateDoc(doc(db, 'calls', callId), payload);
  } catch (err) {
    // Ignore benign terminal state collisions if peer already closed call
    console.warn('Call status update notice:', err);
  }
}

export async function updateCallLanguagesInFirestore(
  callId: string,
  callerLang: LangCode,
  calleeLang: LangCode
): Promise<void> {
  try {
    await updateDoc(doc(db, 'calls', callId), {
      callerLang,
      calleeLang,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
  }
}

export async function saveCallSummaryInFirestore(callId: string, summaryText: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'calls', callId), {
      summaryText: summaryText.slice(0, 4000),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function deleteNotificationItem(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${notificationId}`);
  }
}

export {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  addDoc,
};
export type { CallRecord, NotificationItem };
