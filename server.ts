import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

// Load Firebase client config (public project metadata) for server-side ID token verification & Firestore REST reads
const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseApiKey = '';
let firebaseProjectId = '';
let firestoreDatabaseId = '(default)';
try {
  if (fs.existsSync(firebaseConfigPath)) {
    const raw = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    firebaseApiKey = raw.apiKey || '';
    firebaseProjectId = raw.projectId || '';
    firestoreDatabaseId = raw.firestoreDatabaseId || '(default)';
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

type StrictCallLang = 'bn' | 'id';
type StreamLang = 'bn' | 'id' | 'en';

function normalizeCallLang(val: unknown, fallback: StrictCallLang): StrictCallLang {
  if (val === 'bn' || val === 'id') return val;
  return fallback;
}

function oppositeCallLang(lang: StrictCallLang): StrictCallLang {
  return lang === 'bn' ? 'id' : 'bn';
}

// Fetch a Firestore document on behalf of the verified user using their Firebase ID token
async function fetchFirestoreDocumentFields(
  collectionName: string,
  docId: string,
  idToken: string
): Promise<Record<string, { stringValue?: string }> | null> {
  if (!firebaseProjectId || !docId || !idToken) return null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseProjectId
    )}/databases/${encodeURIComponent(firestoreDatabaseId)}/documents/${encodeURIComponent(
      collectionName
    )}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      fields?: Record<string, { stringValue?: string }>;
    };
    return data.fields ?? null;
  } catch {
    return null;
  }
}

async function resolveLanguagesFromFirestore(params: {
  idToken: string;
  uid: string;
  callId: string;
  mode: 'call' | 'loopback';
  hintSource?: string | null;
  hintTarget?: string | null;
}): Promise<{ sourceLang: StreamLang; targetLang: StreamLang }> {
  const { idToken, uid, callId, mode, hintSource, hintTarget } = params;

  const userFields = await fetchFirestoreDocumentFields('users', uid, idToken);
  const userPref = normalizeCallLang(userFields?.preferredLanguage?.stringValue, 'bn');

  if (mode === 'loopback') {
    const allowedLoopback = (v: unknown, fb: StreamLang): StreamLang =>
      v === 'bn' || v === 'id' || v === 'en' ? v : fb;
    const sourceLang = allowedLoopback(hintSource, userPref);
    const defaultTarget: StrictCallLang =
      sourceLang === 'en' ? oppositeCallLang(userPref) : oppositeCallLang(sourceLang);
    const targetLang = allowedLoopback(hintTarget, defaultTarget);
    return { sourceLang, targetLang };
  }

  // Call mode: strictly Bangla <-> Indonesian, anchored in Firestore preferences (never defaults to English)
  const callFields = await fetchFirestoreDocumentFields('calls', callId, idToken);
  if (callFields) {
    const callerUid = callFields.callerUid?.stringValue;
    const calleeUid = callFields.calleeUid?.stringValue;
    const callerLang = callFields.callerLang?.stringValue;
    const calleeLang = callFields.calleeLang?.stringValue;

    if (callerUid === uid) {
      const sourceLang = normalizeCallLang(callerLang, normalizeCallLang(hintSource, userPref));
      const targetLang = normalizeCallLang(calleeLang, normalizeCallLang(hintTarget, oppositeCallLang(sourceLang)));
      return { sourceLang, targetLang };
    }
    if (calleeUid === uid) {
      const sourceLang = normalizeCallLang(calleeLang, normalizeCallLang(hintSource, userPref));
      const targetLang = normalizeCallLang(callerLang, normalizeCallLang(hintTarget, oppositeCallLang(sourceLang)));
      return { sourceLang, targetLang };
    }
  }

  const sourceLang = normalizeCallLang(hintSource, userPref);
  const targetLang = normalizeCallLang(hintTarget, oppositeCallLang(sourceLang));
  return { sourceLang, targetLang };
}

// Initialize server-side Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Live API (gemini-3.5-live-translate-preview, gemini-3.8-live), TTS (gemini-3.8-flash-lite-tts),
// and speech transcription models require v1alpha on the Gemini Developer API.
function getGeminiAlphaClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1alpha',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object') {
    const obj = err as { message?: unknown; error?: { message?: unknown } };
    if (typeof obj.message === 'string' && obj.message) return obj.message;
    if (obj.error && typeof obj.error.message === 'string' && obj.error.message) {
      return obj.error.message;
    }
    try {
      const json = JSON.stringify(obj);
      if (json && json !== '{}') return json;
    } catch {
      // ignore
    }
  }
  return fallback;
}

// Lightweight in-memory Firebase ID token verification cache (avoids repeated lookup latency)
const tokenCache = new Map<string, { uid: string; email: string; expiresAt: number }>();

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email: string } | null> {
  if (!idToken || !firebaseApiKey) return null;
  const cached = tokenCache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) {
    return { uid: cached.uid, email: cached.email };
  }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const user = data.users?.[0];
    if (!user?.localId) return null;
    const verified = { uid: user.localId, email: user.email || '' };
    tokenCache.set(idToken, { ...verified, expiresAt: Date.now() + 4 * 60 * 1000 });
    return verified;
  } catch {
    return null;
  }
}

async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
    return;
  }
  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired authentication session.' });
    return;
  }
  (req as express.Request & { authUser?: { uid: string; email: string } }).authUser = user;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      firebaseConfigured: Boolean(firebaseApiKey),
    });
  });

  // 1. Low-latency smart phrase translation & live call quick-replies (gemini-3.1-flash-lite)
  app.post('/api/ai/phrase-assist', requireAuth, async (req, res) => {
    try {
      const { text, sourceLang, targetLang } = req.body as {
        text?: string;
        sourceLang?: 'bn' | 'id' | 'en';
        targetLang?: 'bn' | 'id' | 'en';
      };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Phrase text is required.' });
        return;
      }
      const ai = getGeminiClient();
      const langName = (l?: string) =>
        l === 'id'
          ? 'Indonesian (Bahasa Indonesia)'
          : l === 'en'
            ? 'English'
            : 'Bangla (Bengali, বাংলা)';
      const srcName = langName(sourceLang);
      const tgtName = langName(targetLang || (sourceLang === 'bn' ? 'id' : 'bn'));

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Translate and adapt this spoken phrase naturally from ${srcName} to ${tgtName}. Never confuse Bangla with Hindi or Indonesian with Malay. Respond in JSON with keys: "translated" (natural target script), "pronunciation" (easy phonetic guide for the speaker), "toneNote" (brief 1-sentence politeness note).\n\nPhrase: "${text.trim()}"`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const raw = (response.text ?? '{}').trim();
      try {
        res.json(JSON.parse(raw));
      } catch {
        res.json({ translated: raw, pronunciation: '', toneNote: '' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Phrase assist failed.';
      res.status(500).json({ error: message });
    }
  });

  // 2. Deep linguistic & cultural nuance analyzer with HIGH thinking (gemini-4-hydrogen + ThinkingLevel.HIGH)
  app.post('/api/ai/deep-nuance', requireAuth, async (req, res) => {
    try {
      const { phrase, sourceLang, targetLang, context } = req.body as {
        phrase?: string;
        sourceLang?: 'bn' | 'id';
        targetLang?: 'bn' | 'id';
        context?: string;
      };
      if (!phrase || !phrase.trim()) {
        res.status(400).json({ error: 'Phrase is required for linguistic analysis.' });
        return;
      }
      const ai = getGeminiClient();
      const srcLabel = sourceLang === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'Bangla (বাংলা)';
      const tgtLabel = targetLang === 'bn' ? 'Bangla (বাংলা)' : 'Indonesian (Bahasa Indonesia)';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this ${srcLabel} expression and provide the highest-fidelity ${tgtLabel} translation.\nContext: ${context || 'Live voice/video call'}\nExpression: "${phrase.trim()}"\n\nInclude:\n1. Formal & respectful version (e.g., আপনি / Anda)\n2. Warm casual version (e.g., তুমি / Kamu)\n3. Cultural nuance & grammar breakdown so meaning is preserved without mixing Hindi or Malay vocabulary.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });

      res.json({ analysis: response.text || '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deep nuance analysis failed.';
      res.status(500).json({ error: message });
    }
  });

  // 3. Search & Maps grounded cultural/travel/location helper (gemini-4-hydrogen)
  app.post('/api/ai/context-search', requireAuth, async (req, res) => {
    try {
      const { query, mode, lat, lng } = req.body as {
        query?: string;
        mode?: 'search' | 'maps';
        lat?: number;
        lng?: number;
      };
      if (!query || !query.trim()) {
        res.status(400).json({ error: 'Query is required.' });
        return;
      }
      const ai = getGeminiClient();

      if (mode === 'maps') {
        const config: Record<string, unknown> = {
          tools: [{ googleMaps: {} }],
        };
        if (typeof lat === 'number' && typeof lng === 'number') {
          config.toolConfig = {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng },
            },
          };
        }
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: query.trim(),
          config,
        });
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const links = chunks
          .map((c) => {
            const maps = (c as { maps?: { uri?: string; title?: string } }).maps;
            if (maps?.uri) return { title: maps.title || 'Google Maps Place', uri: maps.uri };
            return null;
          })
          .filter(Boolean);
        res.json({ text: response.text || '', links });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `${query.trim()}\n(Provide a concise, helpful answer relevant to Bangla and Indonesian speakers.)`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const links = chunks
        .map((c) => {
          const web = (c as { web?: { uri?: string; title?: string } }).web;
          if (web?.uri) return { title: web.title || web.uri, uri: web.uri };
          return null;
        })
        .filter(Boolean);
      res.json({ text: response.text || '', links });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Grounded context lookup failed.';
      res.status(500).json({ error: message });
    }
  });

  // 4. Call transcript summary (gemini-4-hydrogen)
  app.post('/api/ai/call-summary', requireAuth, async (req, res) => {
    try {
      const { captions, callerLang, calleeLang } = req.body as {
        captions?: Array<{ speakerName: string; original: string; translated: string }>;
        callerLang?: string;
        calleeLang?: string;
      };
      if (!Array.isArray(captions) || captions.length === 0) {
        res.status(400).json({ error: 'No conversation captions provided to summarize.' });
        return;
      }
      const ai = getGeminiClient();
      const transcriptText = captions
        .slice(-120)
        .map((c) => `${c.speakerName}: ${c.original} (${c.translated})`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Summarize this bilingual (${callerLang || 'bn'} ↔ ${calleeLang || 'id'}) call transcript concisely with key topics and follow-ups in English, Bangla (বাংলা), and Bahasa Indonesia:\n\n${transcriptText}`,
      });
      res.json({ summary: response.text || '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Call summary generation failed.';
      res.status(500).json({ error: message });
    }
  });

  // 5. Audio Transcription endpoint (gemini-3.5-transcribe)
  app.post('/api/ai/transcribe', requireAuth, async (req, res) => {
    try {
      const { audioBase64, mimeType, languageHint } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        languageHint?: 'bn' | 'id' | 'auto';
      };
      if (!audioBase64) {
        res.status(400).json({ error: 'Audio payload is required.' });
        return;
      }
      const ai = getGeminiAlphaClient();
      const hintPrompt =
        languageHint === 'bn'
          ? 'Transcribe this spoken Bangla (বাংলা) audio accurately in Bengali script.'
          : languageHint === 'id'
            ? 'Transcribe this spoken Indonesian (Bahasa Indonesia) audio accurately.'
            : 'Transcribe this audio accurately in its spoken language (Bangla or Bahasa Indonesia).';

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType || 'audio/webm', data: audioBase64 } },
            { text: hintPrompt },
          ],
        },
      });
      res.json({ transcript: response.text || '' });
    } catch (err) {
      const message = formatGeminiError(err, 'Audio transcription failed.');
      res.status(500).json({ error: message });
    }
  });

  // 6. Text-to-Speech endpoint (gemini-3.8-flash-lite-tts via v1alpha)
  app.post('/api/ai/tts', requireAuth, async (req, res) => {
    try {
      const { text, voiceName, style } = req.body as {
        text?: string;
        voiceName?: string;
        style?: string;
      };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required for TTS.' });
        return;
      }
      const ai = getGeminiAlphaClient();
      const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      const chosenVoice = allowedVoices.includes(voiceName || '') ? voiceName! : 'Zephyr';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim().slice(0, 600),
                speechMetadata: {
                  style: style || 'Warm, natural conversational speaker with clear pronunciation',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        res.status(502).json({ error: 'No audio returned from TTS model.' });
        return;
      }
      res.json({ audioBase64, mimeType: 'audio/wav' });
    } catch (err) {
      const message = formatGeminiError(err, 'Speech generation failed.');
      res.status(500).json({ error: message });
    }
  });

  // Create HTTP server for Express + WebSockets
  const server = http.createServer(app);

  // Signaling WebSocket Hub (/ws/signal)
  const signalWss = new WebSocketServer({ noServer: true });
  const signalClients = new Map<string, WebSocket>();
  const wsAliveMap = new WeakMap<WebSocket, boolean>();

  // Translation WebSocket Hub (/ws/translate)
  const translateWss = new WebSocketServer({ noServer: true });
  interface ActiveTranslateStream {
    ws: WebSocket;
    idToken: string;
    callId: string;
    uid: string;
    speakerName: string;
    sourceLang: StreamLang;
    targetLang: StreamLang;
    mode: 'call' | 'loopback';
    session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null;
    pendingAudioQueue: string[];
    sessionGeneration: number;
    useFallbackModel: boolean;
    reconnectAttempts: number;
    reconnectTimer: ReturnType<typeof setTimeout> | null;
    isReconfiguring: boolean;
    closed: boolean;
  }
  const translateStreams = new Map<string, ActiveTranslateStream>();

  function getPeerTranslateStreams(callId: string, senderUid: string): ActiveTranslateStream[] {
    const peers: ActiveTranslateStream[] = [];
    for (const stream of translateStreams.values()) {
      if (stream.callId === callId && stream.uid !== senderUid && stream.mode === 'call' && !stream.closed) {
        peers.push(stream);
      }
    }
    return peers;
  }

  function safeSend(ws: WebSocket | undefined, payload: Record<string, unknown>) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  // Server-level WebSocket ping/pong heartbeat so reverse proxies never drop persistent streams
  const heartbeatInterval = setInterval(() => {
    for (const client of [...signalWss.clients, ...translateWss.clients]) {
      if (wsAliveMap.get(client) === false) {
        client.terminate();
        continue;
      }
      wsAliveMap.set(client, false);
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.ping();
        } catch {
          // ignore
        }
      }
    }
  }, 20000);

  server.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  signalWss.on('connection', (ws) => {
    let authedUid: string | null = null;
    wsAliveMap.set(ws, true);
    ws.on('pong', () => wsAliveMap.set(ws, true));

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (msg.type === 'auth') {
          const token = String(msg.token || '');
          const verified = await verifyFirebaseIdToken(token);
          if (!verified) {
            safeSend(ws, { type: 'auth_error', error: 'Invalid Firebase auth token.' });
            ws.close();
            return;
          }
          authedUid = verified.uid;
          signalClients.set(authedUid, ws);
          safeSend(ws, { type: 'auth_ok', uid: authedUid });
          return;
        }

        if (!authedUid) {
          safeSend(ws, { type: 'error', error: 'Unauthenticated signaling socket.' });
          return;
        }

        if (msg.type === 'ping') {
          safeSend(ws, { type: 'pong', ts: Date.now() });
          return;
        }

        const toUid = typeof msg.toUid === 'string' ? msg.toUid : '';
        if (toUid) {
          const targetWs = signalClients.get(toUid);
          safeSend(targetWs, {
            ...msg,
            fromUid: authedUid,
            serverTs: Date.now(),
          });
        }
      } catch (err) {
        console.error('Signal WS error:', err);
      }
    });

    ws.on('close', () => {
      if (authedUid && signalClients.get(authedUid) === ws) {
        signalClients.delete(authedUid);
      }
    });
  });

  function describeLang(code: StreamLang): string {
    if (code === 'bn') return 'Bangla (Bengali, বাংলা)';
    if (code === 'id') return 'Indonesian (Bahasa Indonesia)';
    return 'English';
  }

  function closeUpstreamGeminiSession(streamState: ActiveTranslateStream) {
    streamState.sessionGeneration += 1;
    const prevSession = streamState.session;
    streamState.session = null;
    if (prevSession) {
      try {
        prevSession.close();
      } catch {
        // ignore
      }
    }
  }

  function clearStreamReconnectTimer(streamState: ActiveTranslateStream) {
    if (streamState.reconnectTimer) {
      clearTimeout(streamState.reconnectTimer);
      streamState.reconnectTimer = null;
    }
  }

  function scheduleUpstreamReconnect(streamState: ActiveTranslateStream, reason: string) {
    if (streamState.closed || streamState.isReconfiguring || streamState.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    clearStreamReconnectTimer(streamState);

    if (streamState.reconnectAttempts >= 6) {
      safeSend(streamState.ws, {
        type: 'translation_status',
        status: 'error',
        sourceLang: streamState.sourceLang,
        targetLang: streamState.targetLang,
        message: reason || 'Live translation stream paused. Tap Retry to reconnect.',
      });
      return;
    }

    const attempt = streamState.reconnectAttempts;
    streamState.reconnectAttempts += 1;
    const delayMs = Math.min(5000, 500 * Math.pow(2, attempt));

    safeSend(streamState.ws, {
      type: 'translation_status',
      status: 'reconnecting',
      sourceLang: streamState.sourceLang,
      targetLang: streamState.targetLang,
      message: 'Reconnecting live Gemini translation session...',
    });

    streamState.reconnectTimer = setTimeout(() => {
      streamState.reconnectTimer = null;
      if (!streamState.closed && !streamState.isReconfiguring && streamState.ws.readyState === WebSocket.OPEN) {
        void openGeminiTranslateSession(streamState, streamState.useFallbackModel);
      }
    }, delayMs);
  }

  async function openGeminiTranslateSession(streamState: ActiveTranslateStream, useFallbackModel = false) {
    if (streamState.closed || streamState.ws.readyState !== WebSocket.OPEN) return;

    clearStreamReconnectTimer(streamState);
    streamState.useFallbackModel = useFallbackModel;
    const gen = ++streamState.sessionGeneration;

    try {
      const ai = getGeminiAlphaClient();
      safeSend(streamState.ws, {
        type: 'translation_status',
        status: 'connecting',
        sourceLang: streamState.sourceLang,
        targetLang: streamState.targetLang,
      });

      let opened = false;
      const modelId = useFallbackModel ? 'gemini-3.8-live' : 'gemini-3.5-live-translate-preview';
      const srcDesc = describeLang(streamState.sourceLang);
      const tgtDesc = describeLang(streamState.targetLang);
      const strictNonEnglishRule =
        streamState.targetLang !== 'en'
          ? ` STRICT RULE: NEVER output or speak English. Every spoken and transcribed output MUST be in ${tgtDesc} (BCP-47 "${streamState.targetLang}").`
          : '';

      const config = useFallbackModel
        ? {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: `You are a simultaneous real-time speech-to-speech translator. Listen to spoken ${srcDesc} audio and IMMEDIATELY speak ONLY the exact, natural translation in ${tgtDesc}. Never reply conversationally, never answer questions, and never confuse Bangla with Hindi or Indonesian with Malay.${strictNonEnglishRule}`,
          }
        : {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            translationConfig: {
              targetLanguageCode: streamState.targetLang,
              echoTargetLanguage: streamState.sourceLang === streamState.targetLang,
            },
          };

      const session = await ai.live.connect({
        model: modelId,
        config,
        callbacks: {
          onopen: () => {
            opened = true;
            if (streamState.closed || streamState.sessionGeneration !== gen) return;
            streamState.reconnectAttempts = 0;
            streamState.isReconfiguring = false;
            safeSend(streamState.ws, {
              type: 'language_configured',
              sourceLang: streamState.sourceLang,
              targetLang: streamState.targetLang,
              model: modelId,
            });
            safeSend(streamState.ws, {
              type: 'translation_status',
              status: 'connected',
              sourceLang: streamState.sourceLang,
              targetLang: streamState.targetLang,
              model: modelId,
            });
          },
          onmessage: (message: LiveServerMessage) => {
            if (streamState.closed || streamState.sessionGeneration !== gen) return;
            const content = message.serverContent;
            const peers =
              streamState.mode === 'loopback'
                ? [streamState]
                : getPeerTranslateStreams(streamState.callId, streamState.uid);

            // 1. Send translated 24kHz PCM audio ONLY to listening recipients (or self in explicit Studio loopback test)
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                for (const peer of peers) {
                  safeSend(peer.ws, {
                    type: 'translated_audio',
                    fromUid: streamState.uid,
                    targetLang: streamState.targetLang,
                    audio: part.inlineData.data,
                  });
                }
              }
            }

            // 2. Interruption handling -> tell peer to flush buffered output if speaker paused/restarted
            if (content?.interrupted) {
              for (const peer of peers) {
                safeSend(peer.ws, {
                  type: 'peer_interrupted',
                  fromUid: streamState.uid,
                });
              }
            }

            // 3. Forward live original & translated captions with authoritative sourceLang/targetLang
            if (content?.inputTranscription?.text) {
              const captionMsg = {
                type: 'caption',
                kind: 'original',
                speakerUid: streamState.uid,
                speakerName: streamState.speakerName,
                lang: streamState.sourceLang,
                sourceLang: streamState.sourceLang,
                targetLang: streamState.targetLang,
                text: content.inputTranscription.text,
                ts: Date.now(),
              };
              safeSend(streamState.ws, captionMsg);
              for (const peer of peers) {
                if (peer !== streamState) safeSend(peer.ws, captionMsg);
              }
            }

            if (content?.outputTranscription?.text) {
              const captionMsg = {
                type: 'caption',
                kind: 'translated',
                speakerUid: streamState.uid,
                speakerName: streamState.speakerName,
                lang: streamState.targetLang,
                sourceLang: streamState.sourceLang,
                targetLang: streamState.targetLang,
                text: content.outputTranscription.text,
                ts: Date.now(),
              };
              safeSend(streamState.ws, captionMsg);
              for (const peer of peers) {
                if (peer !== streamState) safeSend(peer.ws, captionMsg);
              }
            }

            if (content?.turnComplete) {
              const turnMsg = {
                type: 'turn_complete',
                speakerUid: streamState.uid,
                ts: Date.now(),
              };
              safeSend(streamState.ws, turnMsg);
              for (const peer of peers) {
                if (peer !== streamState) safeSend(peer.ws, turnMsg);
              }
            }
          },
          onerror: (err) => {
            if (streamState.closed || streamState.sessionGeneration !== gen || streamState.isReconfiguring) return;
            const errMsg = formatGeminiError(err, 'Live translation stream error');
            console.error(`Live translate error [${streamState.callId}/${streamState.uid}/${modelId}]:`, errMsg);
            streamState.session = null;
            if (!useFallbackModel && !opened) {
              void openGeminiTranslateSession(streamState, true);
              return;
            }
            scheduleUpstreamReconnect(streamState, errMsg);
          },
          onclose: (ev) => {
            if (streamState.closed || streamState.sessionGeneration !== gen || streamState.isReconfiguring) return;
            const closeCode = (ev as { code?: number } | undefined)?.code;
            const closeReason = (ev as { reason?: string } | undefined)?.reason;
            console.warn(
              `Live translate closed [${streamState.callId}/${streamState.uid}/${modelId}] code=${closeCode} reason=${closeReason}`
            );
            streamState.session = null;

            // If specialized translate model closed immediately due to unsupported config/model, switch cleanly to gemini-3.8-live interpreter
            if (!useFallbackModel && closeCode && closeCode !== 1000 && (!opened || closeCode === 1007 || closeCode === 1008)) {
              void openGeminiTranslateSession(streamState, true);
              return;
            }

            // Keep client WebSocket persistent: auto-reconnect upstream Gemini session on unexpected drops or server resets
            const reasonText = closeReason
              ? `Live translation disconnected (${closeCode}): ${closeReason}`
              : closeCode
                ? `Live translation disconnected (code ${closeCode}).`
                : 'Live translation session reset.';
            scheduleUpstreamReconnect(streamState, reasonText);
          },
        },
      });

      if (streamState.closed || streamState.sessionGeneration !== gen) {
        try {
          session.close();
        } catch {
          // ignore
        }
        return;
      }

      streamState.session = session;
      streamState.reconnectAttempts = 0;
      streamState.isReconfiguring = false;

      // Flush any audio frames buffered while upstream session was connecting/reconnecting
      if (streamState.pendingAudioQueue.length > 0) {
        const queued = streamState.pendingAudioQueue.splice(0, streamState.pendingAudioQueue.length);
        for (const chunk of queued) {
          try {
            session.sendRealtimeInput({
              audio: {
                data: chunk,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch {
            break;
          }
        }
      }

      safeSend(streamState.ws, {
        type: 'language_configured',
        sourceLang: streamState.sourceLang,
        targetLang: streamState.targetLang,
        model: modelId,
      });
      safeSend(streamState.ws, {
        type: 'translation_status',
        status: 'connected',
        sourceLang: streamState.sourceLang,
        targetLang: streamState.targetLang,
        model: modelId,
      });
    } catch (err) {
      if (streamState.closed || streamState.sessionGeneration !== gen) return;
      const msg = err instanceof Error ? err.message : 'Unable to connect Gemini Live Translation.';
      console.error(`Failed to open Gemini Live session [${streamState.callId}]:`, err);
      streamState.session = null;
      if (!useFallbackModel) {
        void openGeminiTranslateSession(streamState, true);
        return;
      }
      scheduleUpstreamReconnect(streamState, msg);
    }
  }

  translateWss.on('connection', async (ws, req) => {
    wsAliveMap.set(ws, true);
    ws.on('pong', () => wsAliveMap.set(ws, true));

    const url = new URL(req.url || '/', `http://${requestHostOrLocal(req)}`);
    const token = url.searchParams.get('token') || '';
    const callId = url.searchParams.get('callId') || '';
    const speakerName = url.searchParams.get('name') || 'Speaker';
    const rawSource = url.searchParams.get('sourceLang');
    const rawTarget = url.searchParams.get('targetLang');
    const mode = url.searchParams.get('mode') === 'loopback' ? 'loopback' : 'call';

    const verified = await verifyFirebaseIdToken(token);
    if (!verified || !callId) {
      safeSend(ws, { type: 'translation_status', status: 'error', message: 'Unauthorized translation stream.' });
      ws.close();
      return;
    }

    // Authoritatively resolve user's & call's language preferences from Firestore (never defaulting to English)
    const resolvedLangs = await resolveLanguagesFromFirestore({
      idToken: token,
      uid: verified.uid,
      callId,
      mode,
      hintSource: rawSource,
      hintTarget: rawTarget,
    });

    const streamKey = `${mode}:${callId}:${verified.uid}`;
    const existing = translateStreams.get(streamKey);
    if (existing) {
      existing.closed = true;
      clearStreamReconnectTimer(existing);
      closeUpstreamGeminiSession(existing);
      if (existing.ws.readyState === WebSocket.OPEN && existing.ws !== ws) {
        try {
          existing.ws.close();
        } catch {
          // ignore
        }
      }
      translateStreams.delete(streamKey);
    }

    const streamState: ActiveTranslateStream = {
      ws,
      idToken: token,
      callId,
      uid: verified.uid,
      speakerName,
      sourceLang: resolvedLangs.sourceLang,
      targetLang: resolvedLangs.targetLang,
      mode,
      session: null,
      pendingAudioQueue: [],
      sessionGeneration: 0,
      useFallbackModel: false,
      reconnectAttempts: 0,
      reconnectTimer: null,
      isReconfiguring: false,
      closed: false,
    };
    translateStreams.set(streamKey, streamState);

    safeSend(ws, {
      type: 'language_configured',
      sourceLang: streamState.sourceLang,
      targetLang: streamState.targetLang,
      mode: streamState.mode,
    });

    ws.on('message', async (raw) => {
      if (streamState.closed) return;
      try {
        const data = JSON.parse(raw.toString()) as {
          type?: string;
          audio?: string;
          sourceLang?: string;
          targetLang?: string;
        };

        if (data.type === 'ping') {
          safeSend(ws, { type: 'pong', ts: Date.now() });
          return;
        }

        if (data.type === 'reconfigure' || data.type === 'switch_languages' || data.type === 'sync_preferences') {
          clearStreamReconnectTimer(streamState);
          streamState.isReconfiguring = true;
          streamState.reconnectAttempts = 0;

          if (data.type === 'sync_preferences') {
            const refreshed = await resolveLanguagesFromFirestore({
              idToken: streamState.idToken,
              uid: streamState.uid,
              callId: streamState.callId,
              mode: streamState.mode,
              hintSource: streamState.sourceLang,
              hintTarget: streamState.targetLang,
            });
            streamState.sourceLang = refreshed.sourceLang;
            streamState.targetLang = refreshed.targetLang;
          } else if (streamState.mode === 'call') {
            // In call mode, strictly lock language pair to bn <-> id and never default to English
            const nextSource = normalizeCallLang(data.sourceLang, normalizeCallLang(streamState.sourceLang, 'bn'));
            const nextTarget = normalizeCallLang(data.targetLang, oppositeCallLang(nextSource));
            streamState.sourceLang = nextSource;
            streamState.targetLang = nextTarget;
          } else {
            const allowLoopback = (v: unknown, fb: StreamLang): StreamLang =>
              v === 'bn' || v === 'id' || v === 'en' ? v : fb;
            streamState.sourceLang = allowLoopback(data.sourceLang, streamState.sourceLang);
            streamState.targetLang = allowLoopback(
              data.targetLang,
              streamState.sourceLang === 'en' ? 'bn' : oppositeCallLang(streamState.sourceLang)
            );
          }

          streamState.pendingAudioQueue = [];
          closeUpstreamGeminiSession(streamState);
          streamState.isReconfiguring = false;
          await openGeminiTranslateSession(streamState, false);
          return;
        }

        if (data.type === 'reconnect') {
          clearStreamReconnectTimer(streamState);
          streamState.isReconfiguring = true;
          streamState.reconnectAttempts = 0;
          streamState.pendingAudioQueue = [];
          closeUpstreamGeminiSession(streamState);
          streamState.isReconfiguring = false;
          await openGeminiTranslateSession(streamState, false);
          return;
        }

        if (data.audio) {
          if (streamState.session) {
            try {
              streamState.session.sendRealtimeInput({
                audio: {
                  data: data.audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              });
            } catch {
              // Buffer transiently while upstream session rolls over
              if (streamState.pendingAudioQueue.length >= 40) {
                streamState.pendingAudioQueue.shift();
              }
              streamState.pendingAudioQueue.push(data.audio);
            }
          } else {
            if (streamState.pendingAudioQueue.length >= 40) {
              streamState.pendingAudioQueue.shift();
            }
            streamState.pendingAudioQueue.push(data.audio);
          }
        }
      } catch (err) {
        console.error('Translate WS message error:', err);
      }
    });

    ws.on('close', () => {
      streamState.closed = true;
      clearStreamReconnectTimer(streamState);
      streamState.pendingAudioQueue = [];
      closeUpstreamGeminiSession(streamState);
      if (translateStreams.get(streamKey) === streamState) {
        translateStreams.delete(streamKey);
      }
    });

    await openGeminiTranslateSession(streamState);
  });

  function requestHostOrLocal(req: http.IncomingMessage): string {
    return req.headers.host || 'localhost';
  }

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname;
    if (pathname === '/ws/signal') {
      signalWss.handleUpgrade(request, socket, head, (ws) => {
        signalWss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/translate') {
      translateWss.handleUpgrade(request, socket, head, (ws) => {
        translateWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LinguaConnect AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
