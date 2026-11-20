// Real-time 16kHz PCM encoder & 24kHz gapless AudioContext playback queue for Gemini Live API

export function float32ToBase64Pcm16(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64Pcm16ToFloat32(base64: string): Float32Array<ArrayBuffer> {
  const binary = atob(base64);
  const usableLength = binary.length - (binary.length % 2);
  const bytes = new Uint8Array(usableLength);
  for (let i = 0; i < usableLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer, 0, usableLength / 2);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export class PcmPlayerQueue {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private volume = 1;
  private muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext({ sampleRate: 24000 });
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.muted ? 0 : this.volume;
      this.gainNode.connect(this.ctx.destination);
      this.nextStartTime = this.ctx.currentTime;
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx && !this.muted) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public enqueueBase64Pcm24k(base64: string) {
    const ctx = this.ensureContext();
    const float32 = base64Pcm16ToFloat32(base64);
    if (float32.length === 0) return;

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode!);

    const now = ctx.currentTime;
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.015;
    }

    source.onended = () => {
      this.activeSources.delete(source);
    };
    this.activeSources.add(source);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  public flush() {
    for (const src of this.activeSources) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped source
      }
    }
    this.activeSources.clear();
    if (this.ctx) {
      this.nextStartTime = this.ctx.currentTime;
    }
  }

  public close() {
    this.flush();
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
    this.ctx = null;
    this.gainNode = null;
  }
}

export interface MicCaptureController {
  stop: () => void;
  setMuted: (muted: boolean) => void;
}

function downsampleFloat32(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || fromRate <= 0) return input;
  const ratio = fromRate / toRate;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const s0 = input[Math.min(idx, input.length - 1)];
    const s1 = input[Math.min(idx + 1, input.length - 1)];
    result[i] = s0 + (s1 - s0) * frac;
  }
  return result;
}

export function startMicPcmCapture(
  stream: MediaStream,
  onPcmChunk: (base64Pcm: string, rmsLevel: number) => void
): MicCaptureController {
  const ctx = new AudioContext({ sampleRate: 16000 });
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(2048, 1, 1);
  // Route through zero-gain node so mic audio never echoes into local speakers
  const silentGain = ctx.createGain();
  silentGain.gain.value = 0;

  let isMuted = false;

  processor.onaudioprocess = (event) => {
    if (isMuted) {
      onPcmChunk('', 0);
      return;
    }
    const rawInput = event.inputBuffer.getChannelData(0);
    let sumSq = 0;
    for (let i = 0; i < rawInput.length; i++) {
      sumSq += rawInput[i] * rawInput[i];
    }
    const rms = Math.sqrt(sumSq / rawInput.length);
    const resampled = ctx.sampleRate !== 16000 ? downsampleFloat32(rawInput, ctx.sampleRate, 16000) : rawInput;
    const base64 = float32ToBase64Pcm16(resampled);
    onPcmChunk(base64, rms);
  };

  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(ctx.destination);

  return {
    setMuted: (muted: boolean) => {
      isMuted = muted;
    },
    stop: () => {
      try {
        processor.disconnect();
        source.disconnect();
        silentGain.disconnect();
        if (ctx.state !== 'closed') {
          void ctx.close();
        }
      } catch {
        // Ignore teardown errors
      }
    },
  };
}

// Subtle studio ringtone synthesizer (no external mp3 required)
export function startRingtone(): () => void {
  let stopped = false;
  let ctx: AudioContext | null = null;
  let intervalId: number | null = null;

  const playChime = () => {
    if (stopped) return;
    try {
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContext();
      }
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25];
      freqs.forEach((f, idx) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.16);
        gain.gain.setValueAtTime(0.001, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.16 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.16);
        osc.stop(now + idx * 0.16 + 0.6);
      });
    } catch {
      // Autoplay policy may block before user gesture
    }
  };

  playChime();
  intervalId = window.setInterval(playChime, 2400);

  return () => {
    stopped = true;
    if (intervalId !== null) window.clearInterval(intervalId);
    if (ctx && ctx.state !== 'closed') {
      void ctx.close();
    }
  };
}

export function playBase64Wav(base64Audio: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Failed to play synthesized audio.'));
    audio.play().catch(reject);
  });
}
