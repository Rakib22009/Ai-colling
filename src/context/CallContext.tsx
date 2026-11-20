import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createCallInFirestore,
  updateCallLanguagesInFirestore,
  updateCallStatusInFirestore,
} from '../firebase';
import type { CallRecord, CallType, CaptionEntry, LangCode } from '../types';
import {
  MicCaptureController,
  PcmPlayerQueue,
  startMicPcmCapture,
  startRingtone,
} from '../utils/audio';
import { showBrowserNotification } from '../utils/notifications';
import { useAuth } from './AuthContext';

export interface ActiveCallSession {
  callId: string;
  type: CallType;
  role: 'caller' | 'callee';
  peerUid: string;
  peerName: string;
  peerPhoto?: string;
  myLang: LangCode;
  peerLang: LangCode;
  status: 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'ended';
  startedAtMs: number;
}

export interface IncomingCallAlert {
  callId: string;
  type: CallType;
  fromUid: string;
  fromName: string;
  fromPhoto?: string;
  callerLang: LangCode;
  calleeLang: LangCode;
}

type TranslationPipelineStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error' | 'paused';

interface CallContextValue {
  signalConnected: boolean;
  activeCall: ActiveCallSession | null;
  incomingCall: IncomingCallAlert | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micMuted: boolean;
  cameraOff: boolean;
  facingMode: 'user' | 'environment';
  audioMode: 'translated' | 'original';
  translationEnabled: boolean;
  captionsEnabled: boolean;
  translationStatus: TranslationPipelineStatus;
  translationStatusMessage: string;
  speakerVolume: number;
  localMicLevel: number;
  captions: CaptionEntry[];
  callDurationSeconds: number;
  startCall: (
    callee: { uid: string; displayName: string; photoURL?: string; preferredLanguage: LangCode },
    type: CallType
  ) => Promise<string | null>;
  acceptIncomingCall: (overrideAlert?: IncomingCallAlert) => Promise<void>;
  rejectIncomingCall: (overrideAlert?: IncomingCallAlert) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMicMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
  setAudioMode: (mode: 'translated' | 'original') => void;
  toggleTranslation: () => void;
  setCaptionsEnabled: (enabled: boolean) => void;
  setSpeakerVolume: (vol: number) => void;
  switchCallLanguages: (myLang: LangCode, peerLang: LangCode) => Promise<void>;
  reconnectTranslation: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used inside CallProvider');
  return ctx;
}

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function cleanEnvString(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let val = raw.trim();
  while (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  if (!val || val === 'undefined' || val === 'null' || val.startsWith('MY_')) {
    return '';
  }
  return val;
}

function isValidIceUrl(candidate: string): boolean {
  const match = candidate.match(
    /^(stuns?|turns?):(\[[0-9a-fA-F:]+\]|[a-zA-Z0-9.-]+)(?::(\d{1,5}))?(?:\?transport=(udp|tcp|tls))?$/i
  );
  if (!match) return false;
  if (match[3]) {
    const port = Number(match[3]);
    if (!Number.isInteger(port) || port < 1 || port > 65535) return false;
  }
  return true;
}

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [...DEFAULT_STUN_SERVERS];
  const rawTurn = cleanEnvString(import.meta.env.VITE_TURN_URL);
  if (!rawTurn) return servers;

  const validUrls = rawTurn
    .split(/[\s,]+/)
    .map((entry) => cleanEnvString(entry))
    .filter((entry) => isValidIceUrl(entry));

  if (validUrls.length > 0) {
    const username = cleanEnvString(import.meta.env.VITE_TURN_USERNAME);
    const credential = cleanEnvString(import.meta.env.VITE_TURN_CREDENTIAL);
    servers.push({
      urls: validUrls.length === 1 ? validUrls[0] : validUrls,
      ...(username ? { username } : {}),
      ...(credential ? { credential } : {}),
    });
  }
  return servers;
}

function createSafePeerConnection(): RTCPeerConnection {
  const iceServers = getIceServers();
  try {
    return new RTCPeerConnection({ iceServers });
  } catch (err) {
    console.warn('Custom ICE server rejected by browser, falling back to Google STUN:', err);
    return new RTCPeerConnection({ iceServers: DEFAULT_STUN_SERVERS });
  }
}

function normalizeCallLang(val: unknown, fallback: LangCode): LangCode {
  return val === 'bn' || val === 'id' ? val : fallback;
}

export const CallProvider: React.FC<{
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}> = ({ children, onNavigate }) => {
  const { firebaseUser, privateUser, settings, callHistory, getIdToken, pushToast } = useAuth();

  const [signalConnected, setSignalConnected] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallAlert | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [audioMode, setAudioModeState] = useState<'translated' | 'original'>('translated');
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [translationStatus, setTranslationStatus] = useState<TranslationPipelineStatus>('idle');
  const [translationStatusMessage, setTranslationStatusMessage] = useState('');
  const [speakerVolume, setSpeakerVolumeState] = useState(1);
  const [localMicLevel, setLocalMicLevel] = useState(0);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const signalWsRef = useRef<WebSocket | null>(null);
  const translateWsRef = useRef<WebSocket | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const micCaptureRef = useRef<MicCaptureController | null>(null);
  const pcmPlayerRef = useRef<PcmPlayerQueue>(new PcmPlayerQueue());
  const activeCallRef = useRef<ActiveCallSession | null>(null);
  const incomingCallRef = useRef<IncomingCallAlert | null>(null);
  const stopRingtoneRef = useRef<(() => void) | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const translationEnabledRef = useRef(true);
  const audioModeRef = useRef<'translated' | 'original'>('translated');
  const micMutedRef = useRef(false);
  const durationTimerRef = useRef<number | null>(null);
  const translateReconnectTimerRef = useRef<number | null>(null);
  const translatePingTimerRef = useRef<number | null>(null);
  const translateIntentionalCloseRef = useRef(false);
  const prevPreferredLangRef = useRef<LangCode | null>(null);
  const completedTurnSpeakersRef = useRef<Set<string>>(new Set());
  const offerStartedCallIdRef = useRef<string | null>(null);
  const translationStartedCallIdRef = useRef<string | null>(null);
  const makingOfferRef = useRef(false);
  const connectTranslationStreamRef = useRef<(session: ActiveCallSession, stream: MediaStream) => Promise<void>>(
    async () => {}
  );

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    translationEnabledRef.current = translationEnabled;
  }, [translationEnabled]);

  useEffect(() => {
    audioModeRef.current = audioMode;
    pcmPlayerRef.current.setMuted(audioMode !== 'translated' || !translationEnabled);
  }, [audioMode, translationEnabled]);

  useEffect(() => {
    if (settings) {
      setAudioModeState(settings.defaultAudioMode);
      setTranslationEnabled(settings.autoTranslate);
      setCaptionsEnabled(settings.captionsEnabled);
    }
  }, [settings]);

  const stopIncomingRing = useCallback(() => {
    if (stopRingtoneRef.current) {
      stopRingtoneRef.current();
      stopRingtoneRef.current = null;
    }
  }, []);

  const teardownMediaAndSockets = useCallback(() => {
    if (durationTimerRef.current !== null) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (translateReconnectTimerRef.current !== null) {
      window.clearTimeout(translateReconnectTimerRef.current);
      translateReconnectTimerRef.current = null;
    }
    if (translatePingTimerRef.current !== null) {
      window.clearInterval(translatePingTimerRef.current);
      translatePingTimerRef.current = null;
    }
    if (micCaptureRef.current) {
      micCaptureRef.current.stop();
      micCaptureRef.current = null;
    }
    if (translateWsRef.current) {
      translateIntentionalCloseRef.current = true;
      try {
        translateWsRef.current.close();
      } catch {
        // ignore
      }
      translateWsRef.current = null;
    }
    if (peerConnRef.current) {
      try {
        peerConnRef.current.close();
      } catch {
        // ignore
      }
      peerConnRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pcmPlayerRef.current.flush();
    pendingCandidatesRef.current = [];
    offerStartedCallIdRef.current = null;
    translationStartedCallIdRef.current = null;
    makingOfferRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setLocalMicLevel(0);
    setTranslationStatus('idle');
    setTranslationStatusMessage('');
  }, []);

  const appendCaption = useCallback((msg: {
    kind: 'original' | 'translated';
    speakerUid: string;
    speakerName: string;
    lang: LangCode;
    sourceLang?: LangCode;
    targetLang?: LangCode;
    text: string;
    ts: number;
  }) => {
    const rawText = msg.text;
    if (!rawText || !rawText.trim()) return;
    const forceNewBubble = completedTurnSpeakersRef.current.has(msg.speakerUid);
    if (forceNewBubble) {
      completedTurnSpeakersRef.current.delete(msg.speakerUid);
    }
    setCaptions((prev) => {
      const last = prev[prev.length - 1];
      const sameSpeakerRecent =
        !forceNewBubble && last && last.speakerUid === msg.speakerUid && msg.ts - last.ts < 8000;
      if (sameSpeakerRecent) {
        const updated = { ...last, ts: msg.ts };
        if (msg.kind === 'original') {
          const base = last.original;
          updated.original =
            !base || base.endsWith(' ') || rawText.startsWith(' ') ? `${base}${rawText}` : `${base} ${rawText}`;
        } else {
          const base = last.translated;
          updated.translated =
            !base || base.endsWith(' ') || rawText.startsWith(' ') ? `${base}${rawText}` : `${base} ${rawText}`;
        }
        return [...prev.slice(0, -1), updated];
      }
      const cleanStart = rawText.trim();
      const resolvedSource =
        msg.sourceLang || (msg.kind === 'original' ? msg.lang : (msg.lang === 'bn' ? 'id' : 'bn'));
      const resolvedTarget =
        msg.targetLang || (msg.kind === 'translated' ? msg.lang : (msg.lang === 'bn' ? 'id' : 'bn'));
      const entry: CaptionEntry = {
        id: `${msg.ts}-${Math.random().toString(36).slice(2, 6)}`,
        speakerUid: msg.speakerUid,
        speakerName: msg.speakerName,
        sourceLang: resolvedSource,
        targetLang: resolvedTarget,
        original: msg.kind === 'original' ? cleanStart : '',
        translated: msg.kind === 'translated' ? cleanStart : '',
        ts: msg.ts,
      };
      return [...prev.slice(-40), entry];
    });
  }, []);

  const connectTranslationStream = useCallback(
    async (session: ActiveCallSession, stream: MediaStream) => {
      if (!privateUser) return;
      if (!translationEnabledRef.current) {
        setTranslationStatus('paused');
        return;
      }

      if (translateReconnectTimerRef.current !== null) {
        window.clearTimeout(translateReconnectTimerRef.current);
        translateReconnectTimerRef.current = null;
      }
      if (translatePingTimerRef.current !== null) {
        window.clearInterval(translatePingTimerRef.current);
        translatePingTimerRef.current = null;
      }
      if (translateWsRef.current) {
        translateIntentionalCloseRef.current = true;
        try {
          translateWsRef.current.close();
        } catch {
          // ignore
        }
        translateWsRef.current = null;
      }
      if (micCaptureRef.current) {
        micCaptureRef.current.stop();
        micCaptureRef.current = null;
      }

      try {
        translateIntentionalCloseRef.current = false;
        setTranslationStatus('connecting');
        const currentCall = activeCallRef.current?.callId === session.callId ? activeCallRef.current : session;
        const token = await getIdToken();
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const qs = new URLSearchParams({
          token,
          callId: currentCall.callId,
          name: privateUser.displayName,
          sourceLang: normalizeCallLang(currentCall.myLang, normalizeCallLang(privateUser.preferredLanguage, 'bn')),
          targetLang: normalizeCallLang(currentCall.peerLang, currentCall.myLang === 'bn' ? 'id' : 'bn'),
          mode: 'call',
        });
        const ws = new WebSocket(`${proto}//${window.location.host}/ws/translate?${qs.toString()}`);
        translateWsRef.current = ws;

        ws.onopen = () => {
          translatePingTimerRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 20000);

          const micCtrl = startMicPcmCapture(stream, (base64Pcm, rms) => {
            setLocalMicLevel(rms);
            if (
              base64Pcm &&
              ws.readyState === WebSocket.OPEN &&
              translationEnabledRef.current &&
              !micMutedRef.current
            ) {
              ws.send(JSON.stringify({ audio: base64Pcm }));
            }
          });
          micCtrl.setMuted(micMutedRef.current);
          micCaptureRef.current = micCtrl;
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as {
              type: string;
              audio?: string;
              status?: TranslationPipelineStatus;
              message?: string;
              kind?: 'original' | 'translated';
              speakerUid?: string;
              speakerName?: string;
              lang?: string;
              sourceLang?: string;
              targetLang?: string;
              text?: string;
              ts?: number;
            };

            if (msg.type === 'pong') {
              return;
            }
            if (msg.type === 'language_configured') {
              const cfgSrc = msg.sourceLang === 'bn' || msg.sourceLang === 'id' ? msg.sourceLang : null;
              const cfgTgt = msg.targetLang === 'bn' || msg.targetLang === 'id' ? msg.targetLang : null;
              if (cfgSrc && cfgTgt) {
                setActiveCall((prev) =>
                  prev && prev.callId === session.callId && (prev.myLang !== cfgSrc || prev.peerLang !== cfgTgt)
                    ? { ...prev, myLang: cfgSrc, peerLang: cfgTgt }
                    : prev
                );
              }
              return;
            }
            if (msg.type === 'translated_audio' && msg.audio) {
              if (audioModeRef.current === 'translated' && translationEnabledRef.current) {
                pcmPlayerRef.current.enqueueBase64Pcm24k(msg.audio);
              }
            } else if (msg.type === 'peer_interrupted') {
              pcmPlayerRef.current.flush();
            } else if (msg.type === 'caption' && msg.text && msg.speakerUid && msg.kind) {
              const capLang: LangCode = msg.lang === 'id' ? 'id' : 'bn';
              const capSrc: LangCode | undefined =
                msg.sourceLang === 'bn' || msg.sourceLang === 'id' ? msg.sourceLang : undefined;
              const capTgt: LangCode | undefined =
                msg.targetLang === 'bn' || msg.targetLang === 'id' ? msg.targetLang : undefined;
              appendCaption({
                kind: msg.kind,
                speakerUid: msg.speakerUid,
                speakerName: msg.speakerName || 'Participant',
                lang: capLang,
                sourceLang: capSrc,
                targetLang: capTgt,
                text: msg.text,
                ts: msg.ts || Date.now(),
              });
            } else if (msg.type === 'turn_complete' && msg.speakerUid) {
              completedTurnSpeakersRef.current.add(msg.speakerUid);
            } else if (msg.type === 'translation_status' && msg.status) {
              setTranslationStatus(msg.status);
              setTranslationStatusMessage(msg.message || '');
            }
          } catch {
            // ignore malformed JSON
          }
        };

        ws.onclose = () => {
          if (translatePingTimerRef.current !== null) {
            window.clearInterval(translatePingTimerRef.current);
            translatePingTimerRef.current = null;
          }
          if (micCaptureRef.current) {
            micCaptureRef.current.stop();
            micCaptureRef.current = null;
          }
          if (
            !translateIntentionalCloseRef.current &&
            translateWsRef.current === ws &&
            activeCallRef.current?.callId === session.callId &&
            translationEnabledRef.current
          ) {
            setTranslationStatus('reconnecting');
            translateReconnectTimerRef.current = window.setTimeout(() => {
              if (activeCallRef.current?.callId === session.callId && localStreamRef.current) {
                void connectTranslationStream(activeCallRef.current, localStreamRef.current);
              }
            }, 2000);
          }
        };
      } catch (err) {
        setTranslationStatus('error');
        setTranslationStatusMessage(err instanceof Error ? err.message : 'Translation connection failed.');
      }
    },
    [appendCaption, getIdToken, privateUser]
  );

  useEffect(() => {
    connectTranslationStreamRef.current = connectTranslationStream;
  }, [connectTranslationStream]);

  const initiateWebRtcOffer = useCallback(
    async (session: ActiveCallSession, pc: RTCPeerConnection, ws: WebSocket) => {
      if (offerStartedCallIdRef.current === session.callId) return;
      if (makingOfferRef.current || pc.signalingState !== 'stable' || pc.localDescription) return;
      if (ws.readyState !== WebSocket.OPEN) return;

      offerStartedCallIdRef.current = session.callId;
      makingOfferRef.current = true;
      try {
        const offer = await pc.createOffer();
        if (peerConnRef.current !== pc || pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'webrtc:offer',
              toUid: session.peerUid,
              callId: session.callId,
              sdp: pc.localDescription || offer,
            })
          );
        }
      } catch (err) {
        offerStartedCallIdRef.current = null;
        console.error('Failed to initiate WebRTC offer:', err);
      } finally {
        makingOfferRef.current = false;
      }
    },
    []
  );

  const setupPeerConnection = useCallback(
    async (session: ActiveCallSession, stream: MediaStream) => {
      const pc = createSafePeerConnection();
      peerConnRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
        setRemoteStream(new MediaStream(remote.getTracks()));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && signalWsRef.current?.readyState === WebSocket.OPEN) {
          signalWsRef.current.send(
            JSON.stringify({
              type: 'webrtc:ice',
              toUid: session.peerUid,
              callId: session.callId,
              candidate: event.candidate,
            })
          );
        }
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === 'connected') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : prev));
        } else if (st === 'disconnected') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'reconnecting' } : prev));
        } else if (st === 'failed') {
          pushToast('error', 'Peer media connection failed. Attempting recovery...');
        }
      };

      return pc;
    },
    [pushToast]
  );

  const captureLocalMedia = useCallback(
    async (type: CallType, mode: 'user' | 'environment' = 'user'): Promise<MediaStream> => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    },
    []
  );

  const startDurationTicker = useCallback(() => {
    if (durationTimerRef.current !== null) window.clearInterval(durationTimerRef.current);
    setCallDurationSeconds(0);
    durationTimerRef.current = window.setInterval(() => {
      setCallDurationSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const endCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;

    if (signalWsRef.current?.readyState === WebSocket.OPEN) {
      signalWsRef.current.send(
        JSON.stringify({
          type: 'call:end',
          toUid: current.peerUid,
          callId: current.callId,
        })
      );
    }

    const elapsed = Math.max(0, Math.round((Date.now() - current.startedAtMs) / 1000));
    await updateCallStatusInFirestore(
      current.callId,
      current.status === 'ringing' ? 'missed' : 'ended',
      elapsed
    );

    teardownMediaAndSockets();
    setActiveCall(null);
    setCaptions([]);
    onNavigate('/');
  }, [onNavigate, teardownMediaAndSockets]);

  const acceptIncomingCall = useCallback(
    async (overrideAlert?: IncomingCallAlert) => {
      const alert = overrideAlert || incomingCallRef.current;
      if (!alert || !privateUser) return;

      stopIncomingRing();
      setIncomingCall(null);
      pcmPlayerRef.current.unlock();

      try {
        const stream = await captureLocalMedia(alert.type, facingMode);
        const myLang = normalizeCallLang(privateUser.preferredLanguage, 'id');
        const peerLang = normalizeCallLang(alert.callerLang, myLang === 'bn' ? 'id' : 'bn');
        const session: ActiveCallSession = {
          callId: alert.callId,
          type: alert.type,
          role: 'callee',
          peerUid: alert.fromUid,
          peerName: alert.fromName,
          peerPhoto: alert.fromPhoto,
          myLang,
          peerLang,
          status: 'connecting',
          startedAtMs: Date.now(),
        };
        activeCallRef.current = session;
        setActiveCall(session);
        setCaptions([]);
        setMicMuted(false);
        micMutedRef.current = false;
        setCameraOff(false);

        await setupPeerConnection(session, stream);
        await updateCallStatusInFirestore(alert.callId, 'active');

        if (signalWsRef.current?.readyState === WebSocket.OPEN) {
          signalWsRef.current.send(
            JSON.stringify({
              type: 'call:accept',
              toUid: alert.fromUid,
              callId: alert.callId,
              calleeLang: myLang,
            })
          );
        }

        startDurationTicker();
        translationStartedCallIdRef.current = session.callId;
        void connectTranslationStream(session, stream);
        onNavigate(`/call/${alert.type}/${alert.callId}`);
      } catch (err) {
        teardownMediaAndSockets();
        setActiveCall(null);
        pushToast(
          'error',
          err instanceof Error
            ? `Could not join call: ${err.message}`
            : 'Unable to access microphone or camera.'
        );
        await updateCallStatusInFirestore(alert.callId, 'rejected');
      }
    },
    [
      captureLocalMedia,
      connectTranslationStream,
      facingMode,
      onNavigate,
      privateUser,
      pushToast,
      setupPeerConnection,
      startDurationTicker,
      stopIncomingRing,
      teardownMediaAndSockets,
    ]
  );

  const rejectIncomingCall = useCallback(
    async (overrideAlert?: IncomingCallAlert) => {
      const alert = overrideAlert || incomingCallRef.current;
      if (!alert) return;
      stopIncomingRing();
      setIncomingCall(null);

      if (signalWsRef.current?.readyState === WebSocket.OPEN) {
        signalWsRef.current.send(
          JSON.stringify({
            type: 'call:reject',
            toUid: alert.fromUid,
            callId: alert.callId,
          })
        );
      }
      await updateCallStatusInFirestore(alert.callId, 'rejected');
    },
    [stopIncomingRing]
  );

  const startCall = useCallback(
    async (
      callee: { uid: string; displayName: string; photoURL?: string; preferredLanguage: LangCode },
      type: CallType
    ): Promise<string | null> => {
      if (!privateUser) {
        pushToast('error', 'Please sign in before placing a call.');
        return null;
      }
      if (activeCallRef.current) {
        pushToast('error', 'You are already in an active call.');
        return null;
      }

      try {
        pcmPlayerRef.current.unlock();
        const stream = await captureLocalMedia(type, facingMode);
        const myLang = normalizeCallLang(privateUser.preferredLanguage, 'bn');
        const peerLang = normalizeCallLang(callee.preferredLanguage, myLang === 'bn' ? 'id' : 'bn');
        const callId = await createCallInFirestore({
          caller: { ...privateUser, preferredLanguage: myLang },
          callee: { ...callee, preferredLanguage: peerLang },
          type,
        });

        const session: ActiveCallSession = {
          callId,
          type,
          role: 'caller',
          peerUid: callee.uid,
          peerName: callee.displayName,
          peerPhoto: callee.photoURL,
          myLang,
          peerLang,
          status: 'ringing',
          startedAtMs: Date.now(),
        };
        activeCallRef.current = session;
        setActiveCall(session);
        setCaptions([]);
        setMicMuted(false);
        micMutedRef.current = false;
        setCameraOff(false);

        await setupPeerConnection(session, stream);

        if (signalWsRef.current?.readyState === WebSocket.OPEN) {
          signalWsRef.current.send(
            JSON.stringify({
              type: 'call:invite',
              toUid: callee.uid,
              callId,
              callType: type,
              fromName: privateUser.displayName,
              fromPhoto: privateUser.photoURL || '',
              callerLang: myLang,
              calleeLang: peerLang,
            })
          );
        }

        onNavigate(`/call/${type}/${callId}`);
        return callId;
      } catch (err) {
        teardownMediaAndSockets();
        setActiveCall(null);
        pushToast(
          'error',
          err instanceof Error
            ? `Could not start call: ${err.message}`
            : 'Unable to access microphone/camera to start call.'
        );
        return null;
      }
    },
    [
      captureLocalMedia,
      facingMode,
      onNavigate,
      privateUser,
      pushToast,
      setupPeerConnection,
      teardownMediaAndSockets,
    ]
  );

  // Global Signaling WebSocket lifecycle
  useEffect(() => {
    if (!firebaseUser) {
      if (signalWsRef.current) {
        signalWsRef.current.close();
        signalWsRef.current = null;
      }
      setSignalConnected(false);
      return;
    }

    let closedByCleanup = false;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;

    const connectSignal = async () => {
      try {
        const token = await getIdToken();
        if (closedByCleanup) return;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${proto}//${window.location.host}/ws/signal`);
        signalWsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'auth', token }));
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data) as Record<string, unknown>;
            const type = String(msg.type || '');

            if (type === 'auth_ok') {
              setSignalConnected(true);
              pingTimer = window.setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
              }, 25000);
              return;
            }

            if (type === 'call:invite') {
              if (activeCallRef.current) return;
              const alert: IncomingCallAlert = {
                callId: String(msg.callId),
                type: msg.callType === 'video' ? 'video' : 'voice',
                fromUid: String(msg.fromUid),
                fromName: String(msg.fromName || 'LinguaConnect Friend'),
                fromPhoto: typeof msg.fromPhoto === 'string' ? msg.fromPhoto : undefined,
                callerLang: msg.callerLang === 'id' ? 'id' : 'bn',
                calleeLang: msg.calleeLang === 'bn' ? 'bn' : 'id',
              };
              setIncomingCall(alert);
              stopIncomingRing();
              stopRingtoneRef.current = startRingtone();
              void showBrowserNotification({
                title: alert.type === 'video' ? `Incoming Video Call` : `Incoming Voice Call`,
                body: `${alert.fromName} is calling you with real-time AI translation.`,
                type: 'call_incoming',
                callId: alert.callId,
                callType: alert.type,
                tag: `call-${alert.callId}`,
                url: `/call/${alert.type}/${alert.callId}`,
              });
              return;
            }

            if (type === 'call:accept') {
              const current = activeCallRef.current;
              const pc = peerConnRef.current;
              if (!current || current.callId !== msg.callId || !pc) return;

              const updatedSession: ActiveCallSession = {
                ...current,
                peerLang: msg.calleeLang === 'bn' ? 'bn' : msg.calleeLang === 'id' ? 'id' : current.peerLang,
                status: 'connecting',
                startedAtMs: Date.now(),
              };
              activeCallRef.current = updatedSession;
              setActiveCall(updatedSession);
              startDurationTicker();

              await initiateWebRtcOffer(updatedSession, pc, ws);

              if (localStreamRef.current && translationStartedCallIdRef.current !== updatedSession.callId) {
                translationStartedCallIdRef.current = updatedSession.callId;
                void connectTranslationStreamRef.current(updatedSession, localStreamRef.current);
              }
              return;
            }

            if (type === 'call:reject') {
              const current = activeCallRef.current;
              if (!current || current.callId !== msg.callId) return;
              pushToast('info', `${current.peerName} declined the call.`);
              teardownMediaAndSockets();
              setActiveCall(null);
              onNavigate('/');
              return;
            }

            if (type === 'call:end') {
              if (incomingCallRef.current?.callId === msg.callId) {
                stopIncomingRing();
                setIncomingCall(null);
                return;
              }
              const current = activeCallRef.current;
              if (!current || current.callId !== msg.callId) return;
              pushToast('info', `${current.peerName} ended the call.`);
              teardownMediaAndSockets();
              setActiveCall(null);
              onNavigate('/');
              return;
            }

            if (type === 'webrtc:offer') {
              const pc = peerConnRef.current;
              const current = activeCallRef.current;
              const incomingSdp = msg.sdp as RTCSessionDescriptionInit | undefined;
              if (!pc || !current || current.callId !== msg.callId || !incomingSdp || pc.signalingState === 'closed') {
                return;
              }
              if (pc.remoteDescription?.type === incomingSdp.type && pc.remoteDescription?.sdp === incomingSdp.sdp) {
                return;
              }

              const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
              const isPolite = current.role === 'callee';
              if (offerCollision && !isPolite) {
                return;
              }
              if (offerCollision && isPolite) {
                await pc.setLocalDescription({ type: 'rollback' });
              }

              await pc.setRemoteDescription(new RTCSessionDescription(incomingSdp));
              for (const cand of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch {
                  // ignore stale candidate
                }
              }
              pendingCandidatesRef.current = [];

              if (pc.signalingState === 'have-remote-offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: 'webrtc:answer',
                      toUid: current.peerUid,
                      callId: current.callId,
                      sdp: pc.localDescription || answer,
                    })
                  );
                }
              }
              return;
            }

            if (type === 'webrtc:answer') {
              const pc = peerConnRef.current;
              const current = activeCallRef.current;
              if (!pc || !current || current.callId !== msg.callId) return;
              // Guard against duplicate or late answers when peer connection is already stable/closed
              if (pc.signalingState !== 'have-local-offer') {
                return;
              }
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit));
              for (const cand of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch {
                  // ignore stale candidate
                }
              }
              pendingCandidatesRef.current = [];
              return;
            }

            if (type === 'webrtc:ice') {
              const pc = peerConnRef.current;
              const candidate = msg.candidate as RTCIceCandidateInit | undefined;
              if (!pc || !candidate || pc.signalingState === 'closed') return;
              if (pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch {
                  // ignore stale candidate
                }
              } else {
                pendingCandidatesRef.current.push(candidate);
              }
              return;
            }

            if (type === 'call:lang_changed') {
              const current = activeCallRef.current;
              if (!current || current.callId !== msg.callId) return;
              const newPeerLang = normalizeCallLang(msg.myLang, 'bn');
              const newMyLang = normalizeCallLang(msg.peerLang, newPeerLang === 'bn' ? 'id' : 'bn');
              const nextSession = { ...current, myLang: newMyLang, peerLang: newPeerLang };
              activeCallRef.current = nextSession;
              setActiveCall(nextSession);
              if (translateWsRef.current?.readyState === WebSocket.OPEN) {
                translateWsRef.current.send(
                  JSON.stringify({
                    type: 'reconfigure',
                    sourceLang: newMyLang,
                    targetLang: newPeerLang,
                  })
                );
              }
              pushToast('info', `${current.peerName} updated translation languages.`);
            }
          } catch (err) {
            console.error('Signal message handler error:', err);
          }
        };

        ws.onclose = () => {
          setSignalConnected(false);
          if (pingTimer !== null) window.clearInterval(pingTimer);
          if (!closedByCleanup) {
            reconnectTimer = window.setTimeout(connectSignal, 2500);
          }
        };
      } catch {
        if (!closedByCleanup) {
          reconnectTimer = window.setTimeout(connectSignal, 3000);
        }
      }
    };

    void connectSignal();

    return () => {
      closedByCleanup = true;
      if (pingTimer !== null) window.clearInterval(pingTimer);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (signalWsRef.current) {
        signalWsRef.current.close();
        signalWsRef.current = null;
      }
      setSignalConnected(false);
    };
  }, [
    firebaseUser,
    getIdToken,
    initiateWebRtcOffer,
    onNavigate,
    pushToast,
    startDurationTicker,
    stopIncomingRing,
    teardownMediaAndSockets,
  ]);

  // Firestore fallback incoming call detector (catches calls created moments before WS reconnected)
  useEffect(() => {
    if (!firebaseUser || activeCall || incomingCall) return;
    const ringing = callHistory.find(
      (c: CallRecord) => c.calleeUid === firebaseUser.uid && c.status === 'ringing'
    );
    if (ringing) {
      const alert: IncomingCallAlert = {
        callId: ringing.id,
        type: ringing.type,
        fromUid: ringing.callerUid,
        fromName: ringing.callerName,
        fromPhoto: ringing.callerPhoto,
        callerLang: ringing.callerLang,
        calleeLang: ringing.calleeLang,
      };
      setIncomingCall(alert);
      stopIncomingRing();
      stopRingtoneRef.current = startRingtone();
      void showBrowserNotification({
        title: alert.type === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call',
        body: `${alert.fromName} is calling you with real-time AI translation.`,
        type: 'call_incoming',
        callId: alert.callId,
        callType: alert.type,
        tag: `call-${alert.callId}`,
        url: `/call/${alert.type}/${alert.callId}`,
      });
    }
  }, [activeCall, callHistory, firebaseUser, incomingCall, stopIncomingRing]);

  // Firestore fallback state sync if caller misses call:accept / call:reject WS packet
  useEffect(() => {
    if (!activeCall) return;
    const record = callHistory.find((c) => c.id === activeCall.callId);
    if (!record) return;

    if (activeCall.role === 'caller' && activeCall.status === 'ringing' && record.status === 'active') {
      const pc = peerConnRef.current;
      const ws = signalWsRef.current;
      const updatedSession: ActiveCallSession = {
        ...activeCall,
        peerLang: record.calleeLang,
        status: 'connecting',
        startedAtMs: Date.now(),
      };
      activeCallRef.current = updatedSession;
      setActiveCall(updatedSession);
      startDurationTicker();
      if (pc && ws?.readyState === WebSocket.OPEN) {
        void initiateWebRtcOffer(updatedSession, pc, ws);
      }
      if (localStreamRef.current && translationStartedCallIdRef.current !== updatedSession.callId) {
        translationStartedCallIdRef.current = updatedSession.callId;
        void connectTranslationStream(updatedSession, localStreamRef.current);
      }
    } else if (record.status === 'rejected' || record.status === 'ended' || record.status === 'missed') {
      teardownMediaAndSockets();
      setActiveCall(null);
      onNavigate('/');
    }
  }, [
    activeCall,
    callHistory,
    connectTranslationStream,
    initiateWebRtcOffer,
    onNavigate,
    startDurationTicker,
    teardownMediaAndSockets,
  ]);

  // Handle Service Worker notification actions (Accept / Decline directly from OS push alert)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      const payload = event.data as {
        type?: string;
        action?: string;
        data?: { callId?: string; url?: string };
      };
      if (payload?.type !== 'LINGUA_NOTIFICATION_ACTION') return;
      if (payload.action === 'accept' && incomingCallRef.current) {
        void acceptIncomingCall(incomingCallRef.current);
      } else if (payload.action === 'reject' && incomingCallRef.current) {
        void rejectIncomingCall(incomingCallRef.current);
      } else if (payload.data?.url) {
        onNavigate(payload.data.url);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [acceptIncomingCall, onNavigate, rejectIncomingCall]);

  const toggleMicMute = useCallback(() => {
    const next = !micMutedRef.current;
    micMutedRef.current = next;
    setMicMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
    micCaptureRef.current?.setMuted(next);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
  }, [cameraOff]);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || activeCallRef.current?.type !== 'video') return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const newTrack = newVideoStream.getVideoTracks()[0];
      if (!newTrack) return;

      const oldTracks = localStreamRef.current.getVideoTracks();
      oldTracks.forEach((t) => {
        localStreamRef.current?.removeTrack(t);
        t.stop();
      });
      localStreamRef.current.addTrack(newTrack);

      const sender = peerConnRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
      setFacingMode(nextMode);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to switch camera.');
    }
  }, [facingMode, pushToast]);

  const setAudioMode = useCallback((mode: 'translated' | 'original') => {
    audioModeRef.current = mode;
    setAudioModeState(mode);
    pcmPlayerRef.current.setMuted(mode !== 'translated' || !translationEnabledRef.current);
  }, []);

  const toggleTranslation = useCallback(() => {
    const next = !translationEnabledRef.current;
    translationEnabledRef.current = next;
    setTranslationEnabled(next);
    pcmPlayerRef.current.setMuted(!next || audioModeRef.current !== 'translated');
    if (next && activeCallRef.current && localStreamRef.current) {
      void connectTranslationStream(activeCallRef.current, localStreamRef.current);
    } else if (!next && translateWsRef.current) {
      try {
        translateWsRef.current.close();
      } catch {
        // ignore
      }
      translateWsRef.current = null;
      setTranslationStatus('paused');
    }
  }, [connectTranslationStream]);

  const setSpeakerVolume = useCallback((vol: number) => {
    setSpeakerVolumeState(vol);
    pcmPlayerRef.current.setVolume(vol);
  }, []);

  const switchCallLanguages = useCallback(
    async (myLang: LangCode, peerLang: LangCode) => {
      const current = activeCallRef.current;
      if (!current) return;
      const safeMy = normalizeCallLang(myLang, 'bn');
      const safePeer = normalizeCallLang(peerLang, safeMy === 'bn' ? 'id' : 'bn');
      const updated = { ...current, myLang: safeMy, peerLang: safePeer };
      activeCallRef.current = updated;
      setActiveCall(updated);
      if (translateWsRef.current?.readyState === WebSocket.OPEN) {
        translateWsRef.current.send(
          JSON.stringify({
            type: 'reconfigure',
            sourceLang: safeMy,
            targetLang: safePeer,
          })
        );
      }
      if (signalWsRef.current?.readyState === WebSocket.OPEN) {
        signalWsRef.current.send(
          JSON.stringify({
            type: 'call:lang_changed',
            toUid: current.peerUid,
            callId: current.callId,
            myLang: safeMy,
            peerLang: safePeer,
          })
        );
      }
      if (current.role === 'caller') {
        await updateCallLanguagesInFirestore(current.callId, safeMy, safePeer);
      } else {
        await updateCallLanguagesInFirestore(current.callId, safePeer, safeMy);
      }
    },
    []
  );

  // Sync live Firestore user preferredLanguage changes into active call if user saves Language Settings mid-call
  useEffect(() => {
    const nextPref = privateUser?.preferredLanguage;
    if (!nextPref) return;
    const prevPref = prevPreferredLangRef.current;
    prevPreferredLangRef.current = nextPref;
    if (prevPref && prevPref !== nextPref && activeCallRef.current) {
      const current = activeCallRef.current;
      const opposite: LangCode = nextPref === 'bn' ? 'id' : 'bn';
      void switchCallLanguages(nextPref, current.peerLang === nextPref ? opposite : current.peerLang);
    }
  }, [privateUser?.preferredLanguage, switchCallLanguages]);

  const reconnectTranslation = useCallback(() => {
    if (translateWsRef.current?.readyState === WebSocket.OPEN) {
      translateWsRef.current.send(JSON.stringify({ type: 'reconnect' }));
    } else if (activeCallRef.current && localStreamRef.current) {
      void connectTranslationStream(activeCallRef.current, localStreamRef.current);
    }
  }, [connectTranslationStream]);

  return (
    <CallContext.Provider
      value={{
        signalConnected,
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        micMuted,
        cameraOff,
        facingMode,
        audioMode,
        translationEnabled,
        captionsEnabled,
        translationStatus,
        translationStatusMessage,
        speakerVolume,
        localMicLevel,
        captions,
        callDurationSeconds,
        startCall,
        acceptIncomingCall,
        rejectIncomingCall,
        endCall,
        toggleMicMute,
        toggleCamera,
        switchCamera,
        setAudioMode,
        toggleTranslation,
        setCaptionsEnabled,
        setSpeakerVolume,
        switchCallLanguages,
        reconnectTranslation,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
