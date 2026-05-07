// ================================================================
// useAudioEngine — Hook integrating AudioEngine with Zustand store
// Connects the audio engine callbacks to the React state layer.
// ================================================================

import { useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '../engine/AudioEngine';
import { useAudioStore } from '../stores/audioStore';
import { StemType, StemAnalysis } from '../types/audio';

export function useAudioEngine() {
  const engineInitialized = useRef(false);
  const store = useAudioStore();

  // Initialize engine on mount
  useEffect(() => {
    if (engineInitialized.current) return;
    engineInitialized.current = true;

    audioEngine.init().then(() => {
      // Wire up callbacks to store
      audioEngine.onAnalysis = (stems: Record<StemType, StemAnalysis>) => {
        const storeRef = useAudioStore.getState();
        for (const [stemType, analysis] of Object.entries(stems)) {
          // Only update if values changed significantly (perf)
          storeRef.updateStemAnalysis(stemType as StemType, analysis);
        }
        // Update master spectrum
        const freqData = audioEngine.getMasterFrequencyData();
        const timeData = audioEngine.getMasterTimeDomainData();
        const freqFloat = new Float32Array(freqData.length);
        const timeFloat = new Float32Array(timeData.length);
        for (let i = 0; i < freqData.length; i++) freqFloat[i] = freqData[i] / 255;
        for (let i = 0; i < timeData.length; i++) timeFloat[i] = (timeData[i] - 128) / 128;
        storeRef.updateMasterSpectrum(freqFloat);
        storeRef.updateMasterWaveform(timeFloat);
      };

      audioEngine.onTimeUpdate = (time: number) => {
        useAudioStore.getState().setCurrentTime(time);
      };

      audioEngine.onBpmDetected = (bpm: number) => {
        useAudioStore.getState().setBpm(bpm);
      };

      audioEngine.onBeat = (time: number, strength: number) => {
        useAudioStore.getState().addBeatMarker({
          time,
          strength,
          type: strength > 0.7 ? 'downbeat' : 'beat',
        });
      };
    });

    return () => {
      // Don't destroy the singleton — it persists for the app lifetime.
      // React StrictMode double-mounts would otherwise kill the AudioContext.
    };
  }, []);

  /** Load an audio file */
  const loadFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const { duration } = await audioEngine.loadFile(arrayBuffer);
    useAudioStore.getState().setFile(file.name, duration);

    // Simulate stem separation with progress
    const storeRef = useAudioStore.getState();
    storeRef.setSeparating(true, 0);

    // Fake separation progress (real Demucs would run via Python backend)
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      useAudioStore.getState().setSeparating(true, i / 100);
    }

    useAudioStore.getState().setSeparating(false, 1);
    useAudioStore.getState().setStemsReady(true);
  }, []);

  /** Toggle play/pause */
  const togglePlay = useCallback(() => {
    const state = useAudioStore.getState();
    if (state.isPlaying) {
      audioEngine.pause();
      useAudioStore.getState().setPlaying(false);
    } else {
      audioEngine.play();
      useAudioStore.getState().setPlaying(true);
    }
  }, []);

  /** Seek to time */
  const seek = useCallback((time: number) => {
    audioEngine.seek(time);
    useAudioStore.getState().setCurrentTime(time);
  }, []);

  /** Set volume */
  const setVolume = useCallback((volume: number) => {
    audioEngine.setVolume(volume);
    useAudioStore.getState().setVolume(volume);
  }, []);

  return {
    loadFile,
    togglePlay,
    seek,
    setVolume,
    isPlaying: store.isPlaying,
    currentTime: store.currentTime,
    duration: store.duration,
    bpm: store.bpm,
    isLoaded: store.isLoaded,
    fileName: store.fileName,
  };
}
