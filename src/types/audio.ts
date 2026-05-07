// ================================================================
// AUDIO TYPES — Core audio analysis data structures
// ================================================================

/** Supported stem/instrument types from AI separation */
export type StemType = 'drums' | 'bass' | 'vocals' | 'guitar' | 'synth' | 'piano' | 'other';

/** All available stems */
export const STEM_TYPES: StemType[] = ['drums', 'bass', 'vocals', 'guitar', 'synth', 'piano', 'other'];

/** Stem display configuration */
export const STEM_CONFIG: Record<StemType, { label: string; color: string; icon: string }> = {
  drums:  { label: 'DRUMS',  color: '#ff3333', icon: '⬤' },
  bass:   { label: 'BASS',   color: '#3366ff', icon: '◆' },
  vocals: { label: 'VOCALS', color: '#ffcc00', icon: '◇' },
  guitar: { label: 'GUITAR', color: '#ff6633', icon: '▲' },
  synth:  { label: 'SYNTH',  color: '#aa33ff', icon: '■' },
  piano:  { label: 'PIANO',  color: '#00ffcc', icon: '▬' },
  other:  { label: 'OTHER',  color: '#666666', icon: '●' },
};

/** Real-time analysis data for a single stem */
export interface StemAnalysis {
  stemType: StemType;
  /** Current RMS loudness (0-1) */
  loudness: number;
  /** Peak detection flag */
  isPeak: boolean;
  /** Onset detected this frame */
  isOnset: boolean;
  /** Spectral energy per band (low, mid, high) */
  spectralEnergy: [number, number, number];
  /** Dominant frequency in Hz */
  dominantFrequency: number;
  /** Rhythm intensity (0-1) */
  rhythmIntensity: number;
  /** Raw FFT data (256 bins) */
  fftData: Float32Array;
  /** Waveform data (256 samples) */
  waveformData: Float32Array;
}

/** Overall audio state */
export interface AudioState {
  /** Loaded file name */
  fileName: string | null;
  /** Duration in seconds */
  duration: number;
  /** Current playback position in seconds */
  currentTime: number;
  /** Is audio playing */
  isPlaying: boolean;
  /** Detected BPM */
  bpm: number;
  /** Master volume (0-1) */
  volume: number;
  /** Is audio loaded */
  isLoaded: boolean;
  /** Is stem separation in progress */
  isSeparating: boolean;
  /** Separation progress (0-1) */
  separationProgress: number;
  /** Are stems ready */
  stemsReady: boolean;
}

/** Per-stem mix state */
export interface StemMixState {
  stemType: StemType;
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number; // -1 to 1
}

/** Beat marker on timeline */
export interface BeatMarker {
  time: number;
  strength: number; // 0-1
  type: 'beat' | 'downbeat' | 'onset';
}
