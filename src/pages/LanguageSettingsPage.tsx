import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Mic, MicOff, ShieldCheck, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { updateProfileAndLanguage, updateUserSettings } from '../firebase';
import type { LangCode, VoiceName } from '../types';
import { MicCaptureController, PcmPlayerQueue, playBase64Wav, startMicPcmCapture } from '../utils/audio';

const VOICES: Array<{ name: VoiceName; description: string }> = [
  { name: 'Zephyr', description: 'Warm, clear studio neutral voice' },
  { name: 'Kore', description: 'Crisp, expressive conversational tone' },
  { name: 'Puck', description: 'Bright, energetic natural cadence' },
  { name: 'Charon', description: 'Deep, calm, measured delivery' },
  { name: 'Fenrir', description: 'Clear, steady broadcast voice' },
];

type TestPair = 'bn-id' | 'id-bn' | 'en-bn' | 'en-id';

const TEST_PAIR_LABELS: Record<TestPair, { label: string; source: 'bn' | 'id' | 'en'; target: 'bn' | 'id' | 'en' }> = {
  'bn-id': { label: 'Bangla (বাংলা) → Bahasa Indonesia', source: 'bn', target: 'id' },
  'id-bn': { label: 'Bahasa Indonesia → Bangla (বাংলা)', source: 'id', target: 'bn' },
  'en-bn': { label: 'English → Bangla (বাংলা)', source: 'en', target: 'bn' },
  'en-id': { label: 'English → Bahasa Indonesia', source: 'en', target: 'id' },
};

interface TestCaption {
  id: string;
  kind: 'original' | 'translated';
  text: string;
}

export const LanguageSettingsPage: React.FC = () => {
  const { privateUser, settings, getIdToken, pushToast } = useAuth();
  const { t } = useI18n();

  const [selectedLang, setSelectedLang] = useState<LangCode>(privateUser?.preferredLanguage || 'bn');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(privateUser?.voiceName || 'Zephyr');
  const [autoDetect, setAutoDetect] = useState(settings?.autoDetectLanguage ?? false);
  const [dialectNote, setDialectNote] = useState(
    settings?.dialectNote || 'Standard Dhaka/Kolkata Bangla ↔ Standard Jakarta Indonesian'
  );
  const [saving, setSaving] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<VoiceName | null>(null);

  // Live Voice Translation Test State
  const [testPair, setTestPair] = useState<TestPair>(
    privateUser?.preferredLanguage === 'id' ? 'id-bn' : 'bn-id'
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [testMicLevel, setTestMicLevel] = useState(0);
  const [testCaptions, setTestCaptions] = useState<TestCaption[]>([]);

  const testWsRef = useRef<WebSocket | null>(null);
  const testMicRef = useRef<MicCaptureController | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testPlayerRef = useRef<PcmPlayerQueue | null>(null);
  const testPingTimerRef = useRef<number | null>(null);
  const testErrorRef = useRef(false);
  const testTurnCompletedRef = useRef(false);

  const stopLiveTest = (preserveError = false) => {
    if (testPingTimerRef.current !== null) {
      window.clearInterval(testPingTimerRef.current);
      testPingTimerRef.current = null;
    }
    try {
      testMicRef.current?.stop();
    } catch {
      // ignore
    }
    testMicRef.current = null;

    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((tr) => tr.stop());
      testStreamRef.current = null;
    }

    if (testWsRef.current) {
      try {
        testWsRef.current.close();
      } catch {
        // ignore
      }
      testWsRef.current = null;
    }

    testPlayerRef.current?.close();
    testPlayerRef.current = null;
    setTestMicLevel(0);
    if (!preserveError || !testErrorRef.current) {
      setTestStatus('idle');
    }
  };

  useEffect(() => {
    return () => {
      stopLiveTest();
    };
  }, []);

  if (!privateUser) return null;

  const startLiveTest = async () => {
    if (testStatus === 'connecting' || testStatus === 'connected') {
      stopLiveTest();
      return;
    }

    setTestStatus('connecting');
    setTestMessage('');
    setTestCaptions([]);
    testErrorRef.current = false;
    testTurnCompletedRef.current = false;

    try {
      const player = new PcmPlayerQueue();
      player.unlock();
      testPlayerRef.current = player;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      testStreamRef.current = stream;

      const token = await getIdToken();
      const pair = TEST_PAIR_LABELS[testPair];
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        token,
        callId: `studio-test-${privateUser.uid}`,
        name: privateUser.displayName,
        sourceLang: pair.source,
        targetLang: pair.target,
        mode: 'loopback',
      });

      const ws = new WebSocket(`${proto}//${window.location.host}/ws/translate?${params.toString()}`);
      testWsRef.current = ws;

      ws.onopen = () => {
        testPingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        const mic = startMicPcmCapture(stream, (base64Pcm, rmsLevel) => {
          setTestMicLevel(rmsLevel);
          if (base64Pcm && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ audio: base64Pcm }));
          }
        });
        testMicRef.current = mic;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type?: string;
            status?: string;
            message?: string;
            audio?: string;
            kind?: 'original' | 'translated';
            text?: string;
          };

          if (msg.type === 'pong' || msg.type === 'language_configured') {
            return;
          }

          if (msg.type === 'translation_status') {
            if (msg.status === 'connected') {
              testErrorRef.current = false;
              setTestStatus('connected');
              setTestMessage('');
            } else if (msg.status === 'connecting' || msg.status === 'reconnecting') {
              setTestStatus('connecting');
            } else if (msg.status === 'error') {
              testErrorRef.current = true;
              setTestStatus('error');
              setTestMessage(msg.message || 'Live translation stream error.');
            } else if (msg.status === 'disconnected') {
              if (!testErrorRef.current) setTestStatus('idle');
            }
            return;
          }

          if (msg.type === 'translated_audio' && msg.audio) {
            testPlayerRef.current?.enqueueBase64Pcm24k(msg.audio);
            return;
          }

          if (msg.type === 'peer_interrupted') {
            testPlayerRef.current?.flush();
            return;
          }

          if (msg.type === 'turn_complete') {
            testTurnCompletedRef.current = true;
            return;
          }

          if (msg.type === 'caption' && msg.text && msg.kind) {
            const rawChunk = msg.text;
            const startFresh = testTurnCompletedRef.current;
            if (startFresh) testTurnCompletedRef.current = false;
            setTestCaptions((prev) => {
              const last = prev[prev.length - 1];
              if (!startFresh && last && last.kind === msg.kind) {
                const spacer =
                  !last.text || last.text.endsWith(' ') || rawChunk.startsWith(' ') ? '' : ' ';
                return [...prev.slice(0, -1), { ...last, text: `${last.text}${spacer}${rawChunk}` }].slice(-10);
              }
              return [
                ...prev.slice(-9),
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  kind: msg.kind!,
                  text: rawChunk.trim(),
                },
              ];
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        testErrorRef.current = true;
        setTestStatus('error');
        setTestMessage('WebSocket connection failed.');
      };

      ws.onclose = () => {
        if (testWsRef.current === ws) {
          stopLiveTest(true);
        }
      };
    } catch (err) {
      testErrorRef.current = true;
      stopLiveTest(true);
      const msg = err instanceof Error ? err.message : 'Unable to start live voice translation test.';
      setTestStatus('error');
      setTestMessage(msg);
      pushToast('error', msg);
    }
  };

  const handleChangeTestPair = (nextPair: TestPair) => {
    setTestPair(nextPair);
    if (testWsRef.current && testWsRef.current.readyState === WebSocket.OPEN) {
      const pair = TEST_PAIR_LABELS[nextPair];
      setTestStatus('connecting');
      setTestCaptions([]);
      testWsRef.current.send(
        JSON.stringify({
          type: 'reconfigure',
          sourceLang: pair.source,
          targetLang: pair.target,
        })
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileAndLanguage(privateUser, {
        preferredLanguage: selectedLang,
        voiceName: selectedVoice,
      });
      await updateUserSettings(privateUser.uid, {
        autoDetectLanguage: autoDetect,
        dialectNote,
      });
      pushToast('success', 'Language and voice preferences saved.');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Unable to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewVoice = async (voice: VoiceName) => {
    setPreviewingVoice(voice);
    try {
      const sampleText =
        selectedLang === 'bn'
          ? 'নমস্কার, আমি লিঙ্গুয়াকানেক্ট এআই থেকে বাংলায় কথা বলছি।'
          : 'Halo, saya berbicara dalam Bahasa Indonesia melalui LinguaConnect AI.';
      const token = await getIdToken();
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: sampleText,
          voiceName: voice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voice preview failed.');
      await playBase64Wav(data.audioBase64);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'TTS preview error.');
    } finally {
      setPreviewingVoice(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">{t.languages.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.languages.subtitle}</p>
      </div>

      {/* 100% Live Voice Translation Mic Test */}
      <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900 dark:text-white">
              {t.languages.liveTestTitle}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t.languages.liveTestDesc}</p>
          </div>
          <button
            type="button"
            onClick={() => void startLiveTest()}
            className={`min-h-[42px] px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shrink-0 transition-colors ${
              testStatus === 'connected' || testStatus === 'connecting'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {testStatus === 'connecting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : testStatus === 'connected' ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {testStatus === 'connected' || testStatus === 'connecting'
              ? t.languages.stopLiveTest
              : t.languages.startLiveTest}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 items-center">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t.languages.testDirection}
            </label>
            <select
              value={testPair}
              onChange={(e) => handleChangeTestPair(e.target.value as TestPair)}
              className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {(Object.keys(TEST_PAIR_LABELS) as TestPair[]).map((key) => (
                <option key={key} value={key}>
                  {TEST_PAIR_LABELS[key].label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {testStatus === 'connected'
                  ? t.languages.liveTestListening
                  : testStatus === 'connecting'
                    ? t.languages.liveTestConnecting
                    : t.languages.liveTestIdle}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-transform duration-75 origin-left"
                style={{ transform: `scaleX(${Math.min(1, testMicLevel * 7)})` }}
              />
            </div>
          </div>
        </div>

        {testMessage && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{testMessage}</p>
        )}

        {testCaptions.length > 0 && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-white dark:bg-slate-900 p-3.5 space-y-2 max-h-44 overflow-y-auto">
            {testCaptions.map((cap) => (
              <div
                key={cap.id}
                className={`text-xs leading-relaxed ${
                  cap.kind === 'translated'
                    ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="uppercase text-[10px] font-mono mr-2 opacity-70">
                  {cap.kind === 'translated' ? 'AI' : 'MIC'}
                </span>
                {cap.text}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Primary Language Pair Selection */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="font-display font-semibold text-base">{t.languages.spokenLangTitle}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.languages.spokenLangDesc}</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedLang('bn')}
            className={`p-4 rounded-2xl border text-left transition-colors ${
              selectedLang === 'bn'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-base">{t.common.bangla}</span>
              {selectedLang === 'bn' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.languages.bnDesc}</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedLang('id')}
            className={`p-4 rounded-2xl border text-left transition-colors ${
              selectedLang === 'id'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-base">{t.common.indonesian}</span>
              {selectedLang === 'id' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.languages.idDesc}</p>
          </button>
        </div>

        <label className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
          <div>
            <p className="text-sm font-medium">{t.languages.autoVerifyTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.languages.autoVerifyDesc}</p>
          </div>
          <input
            type="checkbox"
            checked={autoDetect}
            onChange={(e) => setAutoDetect(e.target.checked)}
            className="w-5 h-5 accent-emerald-600 rounded"
          />
        </label>
      </section>

      {/* Voice Persona & Live TTS Preview */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-base">{t.languages.voicePersonaTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.languages.voicePersonaDesc}</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
          {VOICES.map((voice) => (
            <div key={voice.name} className="flex items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedVoice(voice.name)}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedVoice === voice.name
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedVoice === voice.name && <Check className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{voice.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{voice.description}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePreviewVoice(voice.name)}
                disabled={previewingVoice === voice.name}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {previewingVoice === voice.name ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                {t.languages.preview}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Linguistic Fidelity Note */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <h2 className="font-display font-semibold text-sm">{t.languages.fidelityTitle}</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.languages.fidelityDesc}</p>
        <input
          type="text"
          value={dialectNote}
          onChange={(e) => setDialectNote(e.target.value)}
          maxLength={200}
          className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-[46px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t.languages.savePrefs}
        </button>
      </div>
    </div>
  );
};
