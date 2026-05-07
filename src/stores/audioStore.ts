// ================================================================
// AUDIO STORE — Global audio playback and analysis state (Zustand)
// ================================================================

import { create } from 'zustand';
import { AudioState, StemMixState, StemType, STEM_TYPES, StemAnalysis, BeatMarker } from '../types/audio';

interface AudioStore extends AudioState {
  // Stem mix channels
  stemMixes: Record<StemType, StemMixState>;
  // Real-time analysis per stem
  stemAnalysis: Record<StemType, StemAnalysis>;
  // Beat markers for timeline
  beatMarkers: BeatMarker[];
  // Master spectrum data
  masterSpectrum: Float32Array;
  masterWaveform: Float32Array;

  // Actions
  setFile: (fileName: string, duration: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setLoaded: (loaded: boolean) => void;
  setSeparating: (separating: boolean, progress?: number) => void;
  setStemsReady: (ready: boolean) => void;
  setStemMix: (stemType: StemType, mix: Partial<StemMixState>) => void;
  updateStemAnalysis: (stemType: StemType, analysis: Partial<StemAnalysis>) => void;
  updateMasterSpectrum: (data: Float32Array) => void;
  updateMasterWaveform: (data: Float32Array) => void;
  addBeatMarker: (marker: BeatMarker) => void;
  clearBeatMarkers: () => void;
  reset: () => void;
}

/** Create default stem analysis */
const createDefaultAnalysis = (stemType: StemType): StemAnalysis => ({
  stemType,
  loudness: 0,
  isPeak: false,
  isOnset: false,
  spectralEnergy: [0, 0, 0],
  dominantFrequency: 0,
  rhythmIntensity: 0,
  fftData: new Float32Array(256),
  waveformData: new Float32Array(256),
});

/** Create default stem mix */
const createDefaultMix = (stemType: StemType): StemMixState => ({
  stemType,
  volume: 0.8,
  muted: false,
  solo: false,
  pan: 0,
});

const defaultStemMixes = Object.fromEntries(
  STEM_TYPES.map(s => [s, createDefaultMix(s)])
) as Record<StemType, StemMixState>;

const defaultStemAnalysis = Object.fromEntries(
  STEM_TYPES.map(s => [s, createDefaultAnalysis(s)])
) as Record<StemType, StemAnalysis>;

export const useAudioStore = create<AudioStore>((set) => ({
  // Initial state
  fileName: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  bpm: 0,
  volume: 0.8,
  isLoaded: false,
  isSeparating: false,
  separationProgress: 0,
  stemsReady: false,
  stemMixes: { ...defaultStemMixes },
  stemAnalysis: { ...defaultStemAnalysis },
  beatMarkers: [],
  masterSpectrum: new Float32Array(256),
  masterWaveform: new Float32Array(256),

  // Actions
  setFile: (fileName, duration) => set({ fileName, duration, isLoaded: true }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setBpm: (bpm) => set({ bpm }),
  setVolume: (volume) => set({ volume }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  setSeparating: (isSeparating, progress = 0) => set({ isSeparating, separationProgress: progress }),
  setStemsReady: (stemsReady) => set({ stemsReady }),

  setStemMix: (stemType, mix) => set((state) => ({
    stemMixes: {
      ...state.stemMixes,
      [stemType]: { ...state.stemMixes[stemType], ...mix },
    },
  })),

  updateStemAnalysis: (stemType, analysis) => set((state) => ({
    stemAnalysis: {
      ...state.stemAnalysis,
      [stemType]: { ...state.stemAnalysis[stemType], ...analysis },
    },
  })),

  updateMasterSpectrum: (data) => set({ masterSpectrum: data }),
  updateMasterWaveform: (data) => set({ masterWaveform: data }),

  addBeatMarker: (marker) => set((state) => ({
    beatMarkers: [...state.beatMarkers.slice(-200), marker], // Keep last 200
  })),

  clearBeatMarkers: () => set({ beatMarkers: [] }),

  reset: () => set({
    fileName: null,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    bpm: 0,
    isLoaded: false,
    isSeparating: false,
    separationProgress: 0,
    stemsReady: false,
    stemMixes: { ...defaultStemMixes },
    stemAnalysis: { ...defaultStemAnalysis },
    beatMarkers: [],
    masterSpectrum: new Float32Array(256),
    masterWaveform: new Float32Array(256),
  }),
}));
