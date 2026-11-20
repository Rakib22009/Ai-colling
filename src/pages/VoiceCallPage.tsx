import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Captions,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SmartPhraseDrawer } from '../components/SmartPhraseDrawer';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useI18n } from '../context/I18nContext';
import { LANGUAGE_LABELS } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const VoiceCallPage: React.FC<Props> = ({ onNavigate }) => {
  const { privateUser, getIdToken, pushToast } = useAuth();
  const { t } = useI18n();
  const {
    activeCall,
    remoteStream,
    micMuted,
    audioMode,
    translationEnabled,
    captionsEnabled,
    translationStatus,
    translationStatusMessage,
    speakerVolume,
    localMicLevel,
    captions,
    callDurationSeconds,
    endCall,
    toggleMicMute,
    setAudioMode,
    toggleTranslation,
    setCaptionsEnabled,
    setSpeakerVolume,
    switchCallLanguages,
    reconnectTranslation,
  } = useCall();

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const captionsEndRef = useRef<HTMLDivElement | null>(null);
  const [phraseOpen, setPhraseOpen] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Attach WebRTC remote audio ONLY for fallback "Original Audio" mode; muted during Translated Voice
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (!el) return;
    if (remoteStream) {
      el.srcObject = remoteStream;
    }
    el.muted = audioMode === 'translated' && translationEnabled;
    el.volume = speakerVolume;
  }, [remoteStream, audioMode, translationEnabled, speakerVolume]);

  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions]);

  if (!activeCall) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-base font-semibold">{t.call.noActiveVoice}</p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="min-h-[44px] px-5 rounded-xl bg-emerald-600 text-white text-sm font-medium inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.call.returnDashboard}
        </button>
      </div>
    );
  }

  const swapDirections = () => {
    if (activeCall.myLang !== activeCall.peerLang) {
      void switchCallLanguages(activeCall.peerLang, activeCall.myLang);
    } else {
      const nextPeer = activeCall.myLang === 'bn' ? 'id' : 'bn';
      void switchCallLanguages(activeCall.myLang, nextPeer);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Top Status Strip */}
      <header className="px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="min-h-[40px] px-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.nav.dashboard}
          </button>
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">{t.call.voiceCall}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="capitalize">{activeCall.status}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="font-mono tabular-nums text-emerald-400">
              {formatTimer(callDurationSeconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`font-medium ${
              translationStatus === 'connected'
                ? 'text-emerald-400'
                : translationStatus === 'error'
                  ? 'text-amber-400'
                  : 'text-slate-400'
            }`}
          >
            {t.call.aiTranslation}: {translationStatus}
          </span>
          {(translationStatus === 'error' || translationStatus === 'disconnected') && (
            <button
              type="button"
              onClick={reconnectTranslation}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {t.common.retry}
            </button>
          )}
        </div>
      </header>

      {translationStatus === 'error' && translationStatusMessage && (
        <div className="bg-amber-950/70 border-b border-amber-800/70 px-4 py-2 text-xs text-amber-200 text-center">
          {translationStatusMessage}
        </div>
      )}

      {/* Main Studio Body */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Participant & Audio Routing Column */}
        <section className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            {activeCall.peerPhoto ? (
              <img
                src={activeCall.peerPhoto}
                alt={activeCall.peerName}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-700 text-white flex items-center justify-center text-3xl font-bold ring-4 ring-emerald-500/20">
                {activeCall.peerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-2xl">{activeCall.peerName}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {activeCall.status === 'ringing' ? t.call.ringingPeer : t.call.secureAudio}
              </p>
            </div>

            {/* Mic Energy Indicator */}
            <div className="w-full max-w-[220px] space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-transform duration-75 origin-left"
                  style={{
                    transform: `scaleX(${micMuted ? 0 : Math.min(1, localMicLevel * 7)})`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {micMuted ? t.call.micMuted : t.call.capturingPcm}
              </p>
            </div>
          </div>

          {/* Language Pair Override */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="text-slate-400">{t.call.youSpeak}</p>
                <select
                  aria-label={t.call.youSpeak}
                  value={activeCall.myLang}
                  onChange={(e) => {
                    const nextMy = e.target.value === 'id' ? 'id' : 'bn';
                    const nextPeer = nextMy === activeCall.peerLang ? (nextMy === 'bn' ? 'id' : 'bn') : activeCall.peerLang;
                    void switchCallLanguages(nextMy, nextPeer);
                  }}
                  className="mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-semibold text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="bn">{LANGUAGE_LABELS.bn.native}</option>
                  <option value="id">{LANGUAGE_LABELS.id.native}</option>
                </select>
              </div>
              <button
                type="button"
                onClick={swapDirections}
                className="min-h-[36px] px-3 rounded-lg border border-slate-700 hover:bg-slate-800 inline-flex items-center gap-1.5 text-xs shrink-0"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                {t.call.switchLabel}
              </button>
              <div className="text-right min-w-0">
                <p className="text-slate-400">{t.call.partnerHears}</p>
                <select
                  aria-label={t.call.partnerHears}
                  value={activeCall.peerLang}
                  onChange={(e) => {
                    const nextPeer = e.target.value === 'id' ? 'id' : 'bn';
                    void switchCallLanguages(activeCall.myLang, nextPeer);
                  }}
                  className="mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-semibold text-emerald-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="bn">{LANGUAGE_LABELS.bn.native}</option>
                  <option value="id">{LANGUAGE_LABELS.id.native}</option>
                </select>
              </div>
            </div>

            {/* Audio Output Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setAudioMode('translated')}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  audioMode === 'translated'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.call.translatedVoice}
              </button>
              <button
                type="button"
                onClick={() => setAudioMode('original')}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  audioMode === 'original'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.call.originalAudio}
              </button>
            </div>

            {/* Speaker Volume */}
            <div className="flex items-center gap-3 pt-1">
              {speakerVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={speakerVolume}
                onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                aria-label="Speaker volume"
                className="flex-1 accent-emerald-500"
              />
              <span className="font-mono text-xs text-slate-400 w-9 text-right tabular-nums">
                {Math.round(speakerVolume * 100)}%
              </span>
            </div>
          </div>
        </section>

        {/* Live Bilingual Captions Stream */}
        <section className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col min-h-[320px] max-h-[540px]">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="font-display font-semibold text-base">{t.call.liveCaptions}</h2>
              <p className="text-xs text-slate-400">{t.call.liveCaptionsDesc}</p>
            </div>
            <div className="flex items-center gap-2">
              {captions.length > 0 && (
                <button
                  type="button"
                  disabled={summarizing}
                  onClick={async () => {
                    setSummarizing(true);
                    try {
                      const token = await getIdToken();
                      const res = await fetch('/api/ai/call-summary', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          captions: captions.map((c) => ({
                            speakerName: c.speakerName,
                            original: c.original,
                            translated: c.translated,
                          })),
                          callerLang: activeCall.myLang,
                          calleeLang: activeCall.peerLang,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Summary failed.');
                      setSummaryText(data.summary || '');
                    } catch (err) {
                      pushToast('error', err instanceof Error ? err.message : 'Summary failed.');
                    } finally {
                      setSummarizing(false);
                    }
                  }}
                  className="min-h-[38px] px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-emerald-300 disabled:opacity-50"
                >
                  {summarizing ? t.call.summarizing : t.call.aiSummary}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCaptionsEnabled(!captionsEnabled)}
                className={`min-h-[38px] px-3 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 ${
                  captionsEnabled
                    ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                <Captions className="w-4 h-4" />
                {captionsEnabled ? t.call.captionsOn : t.call.captionsOff}
              </button>
            </div>
          </div>

          {summaryText && (
            <div className="mt-3 rounded-2xl border border-emerald-800/70 bg-emerald-950/40 p-3.5 text-xs text-emerald-100 whitespace-pre-wrap">
              <p className="font-semibold text-emerald-300 mb-1">{t.call.callSummary}</p>
              {summaryText}
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {!captionsEnabled ? (
              <p className="text-sm text-slate-500 text-center py-12">{t.call.captionsTurnedOff}</p>
            ) : captions.length === 0 ? (
              <div className="text-center py-12 space-y-1.5">
                <p className="text-sm text-slate-300">{t.call.listeningSpeech}</p>
                <p className="text-xs text-slate-500">{t.call.captionsHint}</p>
              </div>
            ) : (
              captions.map((c) => {
                const isSelf = c.speakerUid === privateUser?.uid;
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl p-3.5 border ${
                      isSelf
                        ? 'bg-slate-800/70 border-slate-700 ml-6'
                        : 'bg-emerald-950/30 border-emerald-900/60 mr-6'
                    }`}
                  >
                    <p className="text-[11px] text-slate-400 font-medium mb-1">
                      {c.speakerName} · {LANGUAGE_LABELS[c.sourceLang].name} →{' '}
                      {LANGUAGE_LABELS[c.targetLang].name}
                    </p>
                    {c.original && (
                      <p className="text-sm text-slate-200 leading-relaxed">{c.original}</p>
                    )}
                    {c.translated && (
                      <p className="text-sm font-medium text-emerald-300 mt-1 leading-relaxed">
                        {c.translated}
                      </p>
                    )}
                  </div>
                );
              })
            )}
            <div ref={captionsEndRef} />
          </div>
        </section>
      </div>

      {/* Bottom Call Action Bar */}
      <footer className="px-4 py-4 border-t border-slate-800 bg-slate-950/90">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={toggleMicMute}
            className={`min-h-[48px] px-5 rounded-2xl text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              micMuted
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {micMuted ? t.call.unmute : t.call.mute}
          </button>

          <button
            type="button"
            onClick={toggleTranslation}
            className={`min-h-[48px] px-5 rounded-2xl text-sm font-medium inline-flex items-center gap-2 transition-colors ${
              translationEnabled
                ? 'bg-emerald-900/70 border border-emerald-700 text-emerald-200 hover:bg-emerald-900'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {translationEnabled ? t.call.translationOn : t.call.translationOff}
          </button>

          <button
            type="button"
            onClick={() => setPhraseOpen(true)}
            className="min-h-[48px] px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {t.call.phrases}
          </button>

          <button
            type="button"
            onClick={() => void endCall()}
            className="min-h-[48px] px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            {t.call.endCall}
          </button>
        </div>
      </footer>

      <SmartPhraseDrawer
        open={phraseOpen}
        onClose={() => setPhraseOpen(false)}
        defaultSourceLang={activeCall.myLang}
        defaultTargetLang={activeCall.peerLang}
      />
    </div>
  );
};
