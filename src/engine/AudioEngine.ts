// ================================================================
// AUDIO ENGINE — Web Audio API wrapper for playback & analysis
// 
// KEY DESIGN: Each "stem" is isolated by non-overlapping frequency
// bands. When the kick drum hits → only the drums analyser spikes.
// When bass plays → only the bass analyser responds. This gives
// each instrument its own independent loudness/peak signal that
// directly drives its assigned lights.
// ================================================================

import { StemType, STEM_TYPES, StemAnalysis } from '../types/audio';

/**
 * NON-OVERLAPPING frequency bands for each instrument.
 * These are carefully separated so drums don't bleed into bass, etc.
 * 
 * gainBoost amplifies quieter bands so they all register visually.
 * peakThreshold sets when "isPeak" fires — lower = more sensitive.
 */
const STEM_BANDS: Record<StemType, {
  low: number;
  high: number;
  gainBoost: number;
  peakThreshold: number;
  filterQ: number;
}> = {
  drums:  { low: 20,    high: 120,   gainBoost: 3.0, peakThreshold: 0.35, filterQ: 2 },   // Kick, sub-hits
  bass:   { low: 120,   high: 300,   gainBoost: 2.5, peakThreshold: 0.40, filterQ: 1.5 }, // Bass guitar, sub-bass harmonics
  vocals: { low: 300,   high: 2000,  gainBoost: 2.0, peakThreshold: 0.30, filterQ: 0.7 }, // Voice fundamentals
  guitar: { low: 2000,  high: 4000,  gainBoost: 2.2, peakThreshold: 0.35, filterQ: 1 },   // Guitar harmonics, strings
  piano:  { low: 4000,  high: 6000,  gainBoost: 2.5, peakThreshold: 0.30, filterQ: 1 },   // Piano upper register, keys
  synth:  { low: 6000,  high: 10000, gainBoost: 2.8, peakThreshold: 0.25, filterQ: 0.7 }, // Synth leads, bright pads
  other:  { low: 10000, high: 18000, gainBoost: 3.5, peakThreshold: 0.20, filterQ: 0.5 }, // Cymbals, hi-hats, air
};

/** Per-stem smoothing state for peak/onset detection */
interface StemState {
  prevLoudness: number;
  peakHold: number;     // frames remaining for peak hold
  smoothLoudness: number;
  onsetCooldown: number; // frames remaining before next onset
}

/** Beat detection state */
interface BeatState {
  lastBeatTime: number;
  beatInterval: number;
  energyHistory: number[];
  bpm: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Per-stem analysers
  private stemAnalysers: Map<StemType, AnalyserNode> = new Map();
  private stemFilters: Map<StemType, BiquadFilterNode[]> = new Map();
  private stemStates: Map<StemType, StemState> = new Map();

  // Analysis config
  private fftSize = 1024; // Higher resolution for better frequency separation
  private frequencyData: Uint8Array = new Uint8Array(512);
  private timeDomainData: Uint8Array = new Uint8Array(512);

  // Beat detection
  private beatState: BeatState = {
    lastBeatTime: 0,
    beatInterval: 500,
    energyHistory: [],
    bpm: 120,
  };

  // Playback state
  private startTime = 0;
  private pauseTime = 0;
  private isPlaying = false;
  private loop = true;

  // Callbacks
  public onAnalysis: ((stems: Record<StemType, StemAnalysis>) => void) | null = null;
  public onBeat: ((time: number, strength: number) => void) | null = null;
  public onTimeUpdate: ((time: number) => void) | null = null;
  public onBpmDetected: ((bpm: number) => void) | null = null;

  private animationFrameId: number | null = null;

  /** Check if context is usable */
  private isContextUsable(): boolean {
    return !!this.audioContext && this.audioContext.state !== 'closed';
  }

  /** Initialize the audio context and nodes */
  async init(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'closed') {
      this.audioContext = null;
      this.gainNode = null;
      this.analyserNode = null;
      this.stemAnalysers.clear();
      this.stemFilters.clear();
    }
    if (this.isContextUsable()) return;

    this.audioContext = new AudioContext();

    // Master gain
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    // Master analyser (full spectrum)
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.fftSize;
    this.analyserNode.smoothingTimeConstant = 0.7;
    this.gainNode.connect(this.analyserNode);

    // Per-stem: bandpass filter → analyser
    // Each stem gets a SHARP bandpass so only its frequencies register
    for (const stem of STEM_TYPES) {
      const band = STEM_BANDS[stem];

      // Bandpass via lowpass + highpass chain with steeper rolloff
      const lowpass = this.audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = band.high;
      lowpass.Q.value = band.filterQ;

      const highpass = this.audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = band.low;
      highpass.Q.value = band.filterQ;

      // Second stage filters for sharper cutoff (24dB/oct instead of 12dB)
      const lowpass2 = this.audioContext.createBiquadFilter();
      lowpass2.type = 'lowpass';
      lowpass2.frequency.value = band.high;
      lowpass2.Q.value = band.filterQ * 0.7;

      const highpass2 = this.audioContext.createBiquadFilter();
      highpass2.type = 'highpass';
      highpass2.frequency.value = band.low;
      highpass2.Q.value = band.filterQ * 0.7;

      const stemAnalyser = this.audioContext.createAnalyser();
      stemAnalyser.fftSize = this.fftSize;
      stemAnalyser.smoothingTimeConstant = 0.6; // Faster response

      // Route: gainNode → LP → HP → LP2 → HP2 → analyser
      this.gainNode.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(lowpass2);
      lowpass2.connect(highpass2);
      highpass2.connect(stemAnalyser);

      this.stemAnalysers.set(stem, stemAnalyser);
      this.stemFilters.set(stem, [lowpass, highpass, lowpass2, highpass2]);

      // Init per-stem tracking state
      this.stemStates.set(stem, {
        prevLoudness: 0,
        peakHold: 0,
        smoothLoudness: 0,
        onsetCooldown: 0,
      });
    }

    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyserNode.frequencyBinCount);
  }

  /** Load an audio file from ArrayBuffer */
  async loadFile(arrayBuffer: ArrayBuffer): Promise<{ duration: number }> {
    if (!this.isContextUsable()) await this.init();
    this.stop();
    this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.detectBPM();
    return { duration: this.audioBuffer.duration };
  }

  /** Start playback */
  play(fromTime?: number): void {
    if (!this.audioBuffer) return;
    if (!this.isContextUsable()) {
      this.init().then(() => this.play(fromTime));
      return;
    }
    if (this.audioContext!.state === 'suspended') {
      this.audioContext!.resume();
    }
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
    }

    const source = this.audioContext!.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = this.loop;
    source.connect(this.gainNode!);

    const offset = fromTime ?? this.pauseTime;
    source.start(0, offset);
    this.sourceNode = source;
    this.startTime = this.audioContext!.currentTime - offset;
    this.isPlaying = true;

    source.onended = () => {
      if (!this.loop) this.isPlaying = false;
    };

    this.startAnalysisLoop();
  }

  /** Pause playback */
  pause(): void {
    if (!this.isPlaying || !this.audioContext) return;
    this.pauseTime = this.getCurrentTime();
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
    }
    this.isPlaying = false;
    this.stopAnalysisLoop();
  }

  /** Stop and reset */
  stop(): void {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
    }
    this.isPlaying = false;
    this.pauseTime = 0;
    this.stopAnalysisLoop();
  }

  /** Seek to a specific time */
  seek(time: number): void {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.pauseTime = time;
    if (wasPlaying) this.play(time);
  }

  /** Set master volume */
  setVolume(volume: number): void {
    if (this.gainNode && this.isContextUsable()) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext!.currentTime);
    }
  }

  /** Get current playback time */
  getCurrentTime(): number {
    if (!this.audioContext || !this.audioBuffer) return 0;
    if (this.isPlaying) {
      const elapsed = this.audioContext.currentTime - this.startTime;
      return this.loop ? elapsed % this.audioBuffer.duration : Math.min(elapsed, this.audioBuffer.duration);
    }
    return this.pauseTime;
  }

  getIsPlaying(): boolean { return this.isPlaying; }
  getDuration(): number { return this.audioBuffer?.duration ?? 0; }
  getMasterFrequencyData(): Uint8Array { return this.frequencyData; }
  getMasterTimeDomainData(): Uint8Array { return this.timeDomainData; }

  /** Detect BPM using energy autocorrelation */
  private detectBPM(): void {
    if (!this.audioBuffer) return;
    const data = this.audioBuffer.getChannelData(0);
    const sr = this.audioBuffer.sampleRate;
    const ds = 4;
    const down = new Float32Array(Math.floor(data.length / ds));
    for (let i = 0; i < down.length; i++) down[i] = Math.abs(data[i * ds]);

    const ws = Math.floor(sr / ds * 0.01);
    const nw = Math.floor(down.length / ws);
    const e = new Float32Array(nw);
    for (let i = 0; i < nw; i++) {
      let s = 0;
      for (let j = 0; j < ws; j++) s += down[i * ws + j] ** 2;
      e[i] = s / ws;
    }

    const minL = Math.floor(60 / (200 * 0.01));
    const maxL = Math.floor(60 / (60 * 0.01));
    let bestL = minL, bestC = -Infinity;
    for (let lag = minL; lag < Math.min(maxL, nw / 2); lag++) {
      let c = 0;
      const cnt = Math.min(nw - lag, 1000);
      for (let i = 0; i < cnt; i++) c += e[i] * e[i + lag];
      if (c > bestC) { bestC = c; bestL = lag; }
    }

    this.beatState.bpm = Math.max(60, Math.min(200, Math.round(60 / (bestL * 0.01))));
    this.beatState.beatInterval = 60000 / this.beatState.bpm;
    this.onBpmDetected?.(this.beatState.bpm);
  }

  // ================================================================
  // CORE ANALYSIS LOOP — runs every animation frame
  // This is where each instrument's loudness/peak/onset is computed
  // and directly fed to the lighting engine.
  // ================================================================
  private startAnalysisLoop(): void {
    const analyze = () => {
      if (!this.isPlaying) return;

      const currentTime = this.getCurrentTime();
      this.onTimeUpdate?.(currentTime);

      // Master spectrum
      if (this.analyserNode) {
        this.analyserNode.getByteFrequencyData(this.frequencyData);
        this.analyserNode.getByteTimeDomainData(this.timeDomainData);
      }

      const stemResults: Record<string, StemAnalysis> = {};

      for (const stem of STEM_TYPES) {
        const analyser = this.stemAnalysers.get(stem);
        const state = this.stemStates.get(stem);
        if (!analyser || !state) continue;

        const band = STEM_BANDS[stem];
        const fftData = new Uint8Array(analyser.frequencyBinCount);
        const waveData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(fftData);
        analyser.getByteTimeDomainData(waveData);

        // ── LOUDNESS: RMS of time domain, boosted per-stem ──
        let rms = 0;
        for (let i = 0; i < waveData.length; i++) {
          const v = (waveData[i] - 128) / 128;
          rms += v * v;
        }
        rms = Math.sqrt(rms / waveData.length);

        // Apply gain boost and curve for more dramatic response
        // pow(x, 0.6) expands low values, making quiet parts more visible
        const rawLoudness = Math.min(1, Math.pow(rms * band.gainBoost, 0.6));

        // Smooth loudness (fast attack, slow release) — makes lights snappy
        const attack = 0.8;  // How fast light turns ON (higher = faster)
        const release = 0.3; // How fast light fades OFF (lower = slower)
        const smoothFactor = rawLoudness > state.smoothLoudness ? attack : release;
        state.smoothLoudness += (rawLoudness - state.smoothLoudness) * smoothFactor;
        const loudness = state.smoothLoudness;

        // ── PEAK DETECTION: sudden spike above threshold ──
        const isPeak = loudness > band.peakThreshold && loudness > state.prevLoudness * 1.3;
        if (isPeak) state.peakHold = 5; // hold peak for 5 frames
        if (state.peakHold > 0) state.peakHold--;
        const isHoldingPeak = state.peakHold > 0;

        // ── ONSET DETECTION: sharp increase with cooldown ──
        const deltaLoudness = loudness - state.prevLoudness;
        let isOnset = false;
        if (deltaLoudness > 0.15 && state.onsetCooldown <= 0) {
          isOnset = true;
          state.onsetCooldown = 8; // min 8 frames between onsets
        }
        if (state.onsetCooldown > 0) state.onsetCooldown--;
        state.prevLoudness = loudness;

        // ── SPECTRAL ENERGY in three sub-bands ──
        const third = Math.floor(fftData.length / 3);
        let lowE = 0, midE = 0, highE = 0;
        for (let i = 0; i < third; i++) lowE += fftData[i] / 255;
        for (let i = third; i < 2 * third; i++) midE += fftData[i] / 255;
        for (let i = 2 * third; i < fftData.length; i++) highE += fftData[i] / 255;
        lowE /= third; midE /= third; highE /= third;

        // Dominant frequency
        let maxBin = 0, maxVal = 0;
        for (let i = 0; i < fftData.length; i++) {
          if (fftData[i] > maxVal) { maxVal = fftData[i]; maxBin = i; }
        }
        const dominantFrequency = maxBin * (this.audioContext!.sampleRate / this.fftSize);

        // Float arrays for UI visualization
        const fftFloat = new Float32Array(fftData.length);
        const waveFloat = new Float32Array(waveData.length);
        for (let i = 0; i < fftData.length; i++) fftFloat[i] = fftData[i] / 255;
        for (let i = 0; i < waveData.length; i++) waveFloat[i] = (waveData[i] - 128) / 128;

        stemResults[stem] = {
          stemType: stem as StemType,
          loudness,
          isPeak: isHoldingPeak,
          isOnset,
          spectralEnergy: [lowE, midE, highE],
          dominantFrequency,
          rhythmIntensity: Math.min(1, (lowE * 2 + midE) * band.gainBoost * 0.5),
          fftData: fftFloat,
          waveformData: waveFloat,
        };
      }

      this.detectBeat(currentTime);
      this.onAnalysis?.(stemResults as Record<StemType, StemAnalysis>);
      this.animationFrameId = requestAnimationFrame(analyze);
    };

    this.animationFrameId = requestAnimationFrame(analyze);
  }

  /** Energy-based beat detection on master signal */
  private detectBeat(currentTime: number): void {
    if (!this.analyserNode) return;
    let energy = 0;
    for (let i = 0; i < this.frequencyData.length / 4; i++) energy += this.frequencyData[i] / 255;
    energy /= (this.frequencyData.length / 4);

    this.beatState.energyHistory.push(energy);
    if (this.beatState.energyHistory.length > 60) this.beatState.energyHistory.shift();

    const avg = this.beatState.energyHistory.reduce((a, b) => a + b, 0) / this.beatState.energyHistory.length;
    const gap = (currentTime - this.beatState.lastBeatTime) * 1000;

    if (energy > avg * 1.4 && gap > this.beatState.beatInterval * 0.7) {
      this.beatState.lastBeatTime = currentTime;
      this.onBeat?.(currentTime, Math.min(1, (energy - avg) / avg));
    }
  }

  private stopAnalysisLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Cleanup — safe to call multiple times */
  destroy(): void {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch {}
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
