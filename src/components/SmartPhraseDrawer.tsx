import React, { useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Mic,
  Sparkles,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import type { LangCode } from '../types';
import { playBase64Wav } from '../utils/audio';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultSourceLang?: LangCode;
  defaultTargetLang?: LangCode;
}

export const SmartPhraseDrawer: React.FC<Props> = ({
  open,
  onClose,
  defaultSourceLang = 'bn',
  defaultTargetLang = 'id',
}) => {
  const { getIdToken, privateUser, pushToast } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'phrase' | 'nuance' | 'context'>('phrase');
  const [sourceLang, setSourceLang] = useState<LangCode>(defaultSourceLang);
  const [targetLang, setTargetLang] = useState<LangCode>(defaultTargetLang);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const [phraseResult, setPhraseResult] = useState<{
    translated?: string;
    pronunciation?: string;
    toneNote?: string;
  } | null>(null);
  const [playingTts, setPlayingTts] = useState(false);
  const [nuanceResult, setNuanceResult] = useState('');

  const [contextMode, setContextMode] = useState<'search' | 'maps'>('search');
  const [contextResult, setContextResult] = useState<{
    text: string;
    links: Array<{ title: string; uri: string }>;
  } | null>(null);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  if (!open) return null;

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const handleQuickTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    setPhraseResult(null);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/ai/phrase-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText, sourceLang, targetLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Phrase translation failed.');
      setPhraseResult(data);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Translation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakText = async (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    setPlayingTts(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: privateUser?.voiceName || 'Zephyr',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TTS failed.');
      await playBase64Wav(data.audioBase64);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Speech playback failed.');
    } finally {
      setPlayingTts(false);
    }
  };

  const handleDeepNuance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    setNuanceResult('');
    try {
      const token = await getIdToken();
      const res = await fetch('/api/ai/deep-nuance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phrase: inputText,
          sourceLang,
          targetLang,
          context: 'Live Bangla-Indonesian conversation',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nuance analysis failed.');
      setNuanceResult(data.analysis || '');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGroundedLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    setContextResult(null);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (contextMode === 'maps' && 'geolocation' in navigator) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }
      const token = await getIdToken();
      const res = await fetch('/api/ai/context-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: inputText,
          mode: contextMode,
          lat,
          lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Context lookup failed.');
      setContextResult({ text: data.text || '', links: data.links || [] });
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceNoteTranscribe = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const arrayBuf = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        setLoading(true);
        try {
          const token = await getIdToken();
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: recorder.mimeType || 'audio/webm',
              languageHint: sourceLang,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Transcription failed.');
          if (data.transcript) setInputText(data.transcript);
        } catch (err) {
          pushToast('error', err instanceof Error ? err.message : 'Transcription error.');
        } finally {
          setLoading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Microphone access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold font-display">{t.phraseDrawer.title}</h2>
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

        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTab('phrase')}
              className={`py-2 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                tab === 'phrase'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.phraseDrawer.tabPhrase}
            </button>
            <button
              type="button"
              onClick={() => setTab('nuance')}
              className={`py-2 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                tab === 'nuance'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.phraseDrawer.tabNuance}
            </button>
            <button
              type="button"
              onClick={() => setTab('context')}
              className={`py-2 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                tab === 'context'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.phraseDrawer.tabContext}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab !== 'context' ? (
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
              <span className="text-slate-700 dark:text-slate-200">
                {sourceLang === 'bn' ? t.common.bangla : t.common.indonesian}
              </span>
              <button
                type="button"
                onClick={swapLanguages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {t.common.swap}
              </button>
              <span className="text-emerald-700 dark:text-emerald-400">
                {targetLang === 'id' ? t.common.indonesian : t.common.bangla}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setContextMode('search')}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium ${
                  contextMode === 'search'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Globe className="w-4 h-4" />
                {t.phraseDrawer.googleSearch}
              </button>
              <button
                type="button"
                onClick={() => setContextMode('maps')}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium ${
                  contextMode === 'maps'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {t.phraseDrawer.googleMaps}
              </button>
            </div>
          )}

          <form
            onSubmit={
              tab === 'phrase'
                ? handleQuickTranslate
                : tab === 'nuance'
                  ? handleDeepNuance
                  : handleGroundedLookup
            }
            className="space-y-3"
          >
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                placeholder={
                  tab === 'context'
                    ? contextMode === 'maps'
                      ? 'e.g., Halal restaurants near Central Jakarta or Dhaka Gulshan...'
                      : 'e.g., Current Dhaka to Jakarta flight time or Eid greeting customs...'
                    : sourceLang === 'bn'
                      ? 'Type or speak Bangla (e.g., আমি আগামীকাল আসতে পারব না)...'
                      : 'Type or speak Indonesian (e.g., Maaf, saya sedang di jalan)...'
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {tab !== 'context' && (
                <button
                  type="button"
                  onClick={toggleVoiceNoteTranscribe}
                  className={`absolute right-2.5 bottom-2.5 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    recording
                      ? 'bg-red-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === 'phrase'
                ? t.phraseDrawer.translateBtn
                : tab === 'nuance'
                  ? t.phraseDrawer.nuanceBtn
                  : contextMode === 'maps'
                    ? t.phraseDrawer.mapsBtn
                    : t.phraseDrawer.searchBtn}
            </button>
          </form>

          {tab === 'phrase' && phraseResult && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.phraseDrawer.naturalTranslation}</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                    {phraseResult.translated}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpeakText(phraseResult.translated || '')}
                  disabled={playingTts}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0"
                >
                  {playingTts ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              {phraseResult.pronunciation && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t.phraseDrawer.pronunciation} <span className="font-mono">{phraseResult.pronunciation}</span>
                </p>
              )}
              {phraseResult.toneNote && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{phraseResult.toneNote}</p>
              )}
            </div>
          )}

          {tab === 'nuance' && nuanceResult && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {nuanceResult}
            </div>
          )}

          {tab === 'context' && contextResult && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {contextResult.text}
              </p>
              {contextResult.links.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.phraseDrawer.verifiedSources}
                  </p>
                  {contextResult.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-400 hover:underline py-1"
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
