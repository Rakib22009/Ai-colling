import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  CameraOff,
  Captions,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  RefreshCw,
  Sparkles,
  SwitchCamera,
} from 'lucide-react';
import { SmartPhraseDrawer } from '../components/SmartPhraseDrawer';
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

export const VideoCallPage: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useI18n();
  const {
    activeCall,
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
    captions,
    callDurationSeconds,
    endCall,
    toggleMicMute,
    toggleCamera,
    switchCamera,
    setAudioMode,
    toggleTranslation,
    setCaptionsEnabled,
    switchCallLanguages,
    reconnectTranslation,
  } = useCall();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [phraseOpen, setPhraseOpen] = useState(false);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (remoteStream) el.srcObject = remoteStream;
    // Mute WebRTC remote audio when Translated Voice is active so voices never mix
    el.muted = audioMode === 'translated' && translationEnabled;
  }, [remoteStream, audioMode, translationEnabled]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !localStream) return;
    el.srcObject = localStream;
  }, [localStream]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!activeCall) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-base font-semibold">{t.call.noActiveVideo}</p>
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

  const latestCaptions = captions.slice(-2);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-slate-950 text-white overflow-hidden flex flex-col justify-between"
    >
      {/* Remote Full-Bleed Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Placeholder when peer camera stream has not arrived yet */}
      {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
          {activeCall.peerPhoto ? (
            <img
              src={activeCall.peerPhoto}
              alt={activeCall.peerName}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-emerald-700 text-white flex items-center justify-center text-3xl font-bold">
              {activeCall.peerName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-sm text-slate-300 mt-4">
            {activeCall.status === 'ringing'
              ? `${t.call.callingPeer} ${activeCall.peerName}...`
              : t.call.waitingPeerVideo}
          </p>
        </div>
      )}

      {/* Measured Scrim Overlays for Contrast */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

      {/* Top Overlay Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="min-h-[40px] px-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.common.back}
          </button>
          <div>
            <p className="text-sm font-semibold">{activeCall.peerName}</p>
            <p className="text-xs text-slate-300">
              {activeCall.status} · <span className="font-mono tabular-nums">{formatTimer(callDurationSeconds)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeCall.myLang !== activeCall.peerLang) {
                void switchCallLanguages(activeCall.peerLang, activeCall.myLang);
              } else {
                void switchCallLanguages(activeCall.myLang, activeCall.myLang === 'bn' ? 'id' : 'bn');
              }
            }}
            className="min-h-[38px] px-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <span>{LANGUAGE_LABELS[activeCall.myLang].codeLabel}</span>
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">{LANGUAGE_LABELS[activeCall.peerLang].codeLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setAudioMode(audioMode === 'translated' ? 'original' : 'translated')}
            className="min-h-[38px] px-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-xs font-medium"
          >
            {audioMode === 'translated' ? t.call.audioTranslated : t.call.audioOriginal}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="min-h-[38px] min-w-[38px] rounded-xl bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Translation Recovery Notice (Video stays running!) */}
      {translationStatus === 'error' && (
        <div className="relative z-10 mx-auto max-w-md px-4 py-2 rounded-xl bg-amber-950/90 border border-amber-700 text-xs text-amber-100 flex items-center gap-3">
          <span>{translationStatusMessage}</span>
          <button
            type="button"
            onClick={reconnectTranslation}
            className="px-2.5 py-1 rounded-lg bg-amber-700 text-white font-medium inline-flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            {t.common.retry}
          </button>
        </div>
      )}

      {/* Local PiP Camera Preview */}
      <div className="relative z-10 flex-1 flex items-end justify-end px-4 sm:px-6 pb-4 pointer-events-none">
        <div className="pointer-events-auto w-28 sm:w-40 aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden border border-white/25 bg-slate-900 shadow-lg">
          {cameraOff ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
              {t.call.cameraOff}
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
          )}
        </div>
      </div>

      {/* Live Captions & Bottom Controls */}
      <div className="relative z-10 px-4 sm:px-6 pb-6 space-y-4">
        {captionsEnabled && latestCaptions.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-1.5">
            {latestCaptions.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 px-4 py-2.5 text-center"
              >
                <p className="text-[11px] text-slate-400">
                  {c.speakerName} ({LANGUAGE_LABELS[c.sourceLang].codeLabel} →{' '}
                  {LANGUAGE_LABELS[c.targetLang].codeLabel})
                </p>
                {c.original && <p className="text-xs text-slate-200">{c.original}</p>}
                {c.translated && (
                  <p className="text-sm font-semibold text-emerald-300 mt-0.5">{c.translated}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={toggleMicMute}
            className={`min-h-[48px] px-4 rounded-2xl text-xs sm:text-sm font-medium inline-flex items-center gap-2 ${
              micMuted ? 'bg-amber-600 text-white' : 'bg-black/60 border border-white/15 text-white'
            }`}
          >
            {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {micMuted ? t.call.unmute : t.call.mute}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`min-h-[48px] px-4 rounded-2xl text-xs sm:text-sm font-medium inline-flex items-center gap-2 ${
              cameraOff ? 'bg-amber-600 text-white' : 'bg-black/60 border border-white/15 text-white'
            }`}
          >
            {cameraOff ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {cameraOff ? t.call.camOff : t.call.camOn}
          </button>

          <button
            type="button"
            onClick={() => void switchCamera()}
            title="Switch front/rear camera"
            className="min-h-[48px] min-w-[48px] px-3.5 rounded-2xl bg-black/60 border border-white/15 text-white inline-flex items-center justify-center"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleTranslation}
            className={`min-h-[48px] px-4 rounded-2xl text-xs sm:text-sm font-medium ${
              translationEnabled
                ? 'bg-emerald-700/90 border border-emerald-500 text-white'
                : 'bg-black/60 border border-white/15 text-slate-300'
            }`}
          >
            {translationEnabled ? t.call.translateOnShort : t.call.translateOffShort}
          </button>

          <button
            type="button"
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`min-h-[48px] min-w-[48px] px-3.5 rounded-2xl border inline-flex items-center justify-center ${
              captionsEnabled
                ? 'bg-emerald-900/70 border-emerald-600 text-emerald-200'
                : 'bg-black/60 border-white/15 text-slate-300'
            }`}
            title={t.call.liveCaptions}
          >
            <Captions className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setPhraseOpen(true)}
            className="min-h-[48px] min-w-[48px] px-3.5 rounded-2xl bg-black/60 border border-white/15 text-emerald-300 inline-flex items-center justify-center"
            title={t.call.phrases}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => void endCall()}
            className="min-h-[48px] px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            {t.call.endShort}
          </button>
        </div>
      </div>

      <SmartPhraseDrawer
        open={phraseOpen}
        onClose={() => setPhraseOpen(false)}
        defaultSourceLang={activeCall.myLang}
        defaultTargetLang={activeCall.peerLang}
      />
    </div>
  );
};
