// ================================================================
// useLightingEngine — Hook running the lighting engine per frame
// Reads audio analysis from the store and computes fixture states.
// ================================================================

import { useEffect, useRef } from 'react';
import { lightingEngine } from '../engine/LightingEngine';
import { useAudioStore } from '../stores/audioStore';
import { useLightingStore } from '../stores/lightingStore';

export function useLightingEngine() {
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const audioState = useAudioStore.getState();
      const lightState = useLightingStore.getState();

      // Update BPM in lighting engine
      if (audioState.bpm > 0) {
        lightingEngine.setBpm(audioState.bpm);
      }

      // Only compute lighting when audio is actually playing
      if (audioState.isPlaying) {
        const computedStates = lightingEngine.computeFrame(
          lightState.fixtures,
          lightState.mappings,
          audioState.stemAnalysis,
          lightState.stageConfig,
          deltaTime
        );

        // Convert to store format
        const storeStates: Record<string, { color: { r: number; g: number; b: number }; intensity: number }> = {};
        for (const [id, state] of Object.entries(computedStates)) {
          storeStates[id] = {
            color: state.color,
            intensity: state.intensity,
          };
        }

        lightState.batchUpdateFixtureStates(storeStates);
      } else {
        // Audio is NOT playing — zero out all fixtures so nothing glows
        const zeroStates: Record<string, { color: { r: number; g: number; b: number }; intensity: number }> = {};
        for (const fixture of lightState.fixtures) {
          zeroStates[fixture.id] = { color: { r: 0, g: 0, b: 0 }, intensity: 0 };
        }
        lightState.batchUpdateFixtureStates(zeroStates);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
