export type LangCode = 'bn' | 'id';
export type VoiceName = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';

export interface UserPrivate {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  handle: string;
  preferredLanguage: LangCode;
  voiceName: VoiceName;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  handle: string;
  preferredLanguage: LangCode;
  voiceName: VoiceName;
  bio?: string;
  online: boolean;
  lastSeen?: unknown;
  updatedAt?: unknown;
}

export interface UserSettings {
  uid: string;
  autoTranslate: boolean;
  defaultAudioMode: 'translated' | 'original';
  captionsEnabled: boolean;
  saveTranscripts: boolean;
  notificationsEnabled: boolean;
  autoDetectLanguage: boolean;
  dialectNote?: string;
  theme: 'light' | 'dark';
  updatedAt?: unknown;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromPhoto?: string;
  fromHandle: string;
  fromLang: LangCode;
  toUid: string;
  toName: string;
  toPhoto?: string;
  toHandle: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Friendship {
  id: string;
  userA: string;
  userB: string;
  userAName: string;
  userBName: string;
  userAPhoto?: string;
  userBPhoto?: string;
  userAHandle: string;
  userBHandle: string;
  userALang: LangCode;
  userBLang: LangCode;
  createdAt?: unknown;
}

export interface FriendView {
  friendshipId: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  handle: string;
  preferredLanguage: LangCode;
  online?: boolean;
}

export interface NotificationItem {
  id: string;
  toUid: string;
  fromUid: string;
  fromName: string;
  fromPhoto?: string;
  type: 'call_incoming' | 'friend_request' | 'friend_accepted' | 'system';
  title: string;
  body: string;
  callId?: string;
  callType?: 'voice' | 'video' | 'none';
  read: boolean;
  createdAt?: unknown;
}

export interface CallRecord {
  id: string;
  callerUid: string;
  callerName: string;
  callerPhoto?: string;
  callerLang: LangCode;
  calleeUid: string;
  calleeName: string;
  calleePhoto?: string;
  calleeLang: LangCode;
  type: CallType;
  status: CallStatus;
  startedAt?: unknown;
  endedAt?: unknown;
  durationSeconds: number;
  summaryText?: string;
  updatedAt?: unknown;
}

export interface CaptionEntry {
  id: string;
  speakerUid: string;
  speakerName: string;
  sourceLang: LangCode;
  targetLang: LangCode;
  original: string;
  translated: string;
  ts: number;
}

export interface GoogleContactItem {
  resourceName: string;
  name: string;
  email: string;
  photoURL?: string;
}

export const LANGUAGE_LABELS: Record<LangCode, { name: string; native: string; codeLabel: string }> = {
  bn: { name: 'Bangla', native: 'বাংলা', codeLabel: 'BN' },
  id: { name: 'Indonesian', native: 'Bahasa Indonesia', codeLabel: 'ID' },
};
