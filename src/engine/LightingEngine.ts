// ================================================================
// LIGHTING ENGINE — Directly maps instrument audio → light output
//
// CORE IDEA: Each instrument's loudness DIRECTLY controls its
// assigned fixtures. When drums are loud → drum lights are BRIGHT.
// When drums are quiet → drum lights are DIM. The animation style
// just shapes HOW the light reacts (strobe flashes vs smooth pulse),
// but the intensity always follows the audio signal.
// ================================================================

import { StemType, StemAnalysis } from '../types/audio';
import { Fixture, LightMapping, LightColor, AnimationStyle, StageConfig } from '../types/lighting';

/** Computed light state for a single fixture */
export interface ComputedLightState {
  color: LightColor;
  intensity: number;
  beamAngle: number;
  position: { x: number; y: number; z: number };
}

export class LightingEngine {
  private time = 0;
  private bpm = 120;

  setBpm(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
  }

  /**
   * Compute fixture states for the current frame.
   *
   * The key change: intensity = instrument loudness * sensitivity.
   * Animation style only adds character (flash, sweep, etc.)
   * but doesn't reduce the signal — it shapes it.
   */
  computeFrame(
    fixtures: Fixture[],
    mappings: LightMapping[],
    stemAnalysis: Record<StemType, StemAnalysis>,
    _stageConfig: StageConfig,
    deltaTime: number,
  ): Record<string, ComputedLightState> {
    this.time += deltaTime;

    const results: Record<string, ComputedLightState> = {};

    for (const fixture of fixtures) {
      const relevantMappings = mappings.filter(
        m => m.enabled && m.fixtureIds.includes(fixture.id)
      );

      if (relevantMappings.length === 0) {
        // No mapping — completely dark
        results[fixture.id] = {
          color: { r: 0, g: 0, b: 0 },
          intensity: 0,
          beamAngle: 0,
          position: fixture.position,
        };
        continue;
      }

      // Accumulate from all mappings affecting this fixture
      let maxIntensity = 0;
      let blendR = 0, blendG = 0, blendB = 0;
      let totalWeight = 0;

      for (const mapping of relevantMappings) {
        const analysis = stemAnalysis[mapping.stemType];
        if (!analysis) continue;

        // ── GET THE RAW AUDIO SIGNAL ──
        // This is the instrument's current loudness/activity
        let signal = 0;
        switch (mapping.trigger) {
          case 'loudness':
            // Direct loudness → light intensity
            signal = analysis.loudness;
            break;
          case 'peak':
            // Full brightness on peak, follow loudness otherwise
            signal = analysis.isPeak ? 1.0 : analysis.loudness * 0.6;
            break;
          case 'onset':
            // Flash on onset, follow loudness otherwise
            signal = analysis.isOnset ? 1.0 : analysis.loudness * 0.4;
            break;
          case 'spectral':
            // Average spectral energy
            signal = (analysis.spectralEnergy[0] * 0.5 + analysis.spectralEnergy[1] + analysis.spectralEnergy[2]) / 2;
            break;
          case 'rhythm':
            signal = analysis.rhythmIntensity;
            break;
        }

        // Apply sensitivity (user-controlled amplification)
        signal = Math.min(1.0, signal * mapping.sensitivity);

        // ── APPLY ANIMATION STYLE ──
        // This shapes the response but doesn't reduce the overall level.
        // e.g. "strobe" makes it flash on/off, "pulse" adds a sine wobble
        const shaped = this.shapeSignal(
          mapping.animationStyle,
          signal,
          fixture,
          analysis,
        );

        // The final intensity for this mapping
        const intensity = shaped * fixture.intensity;

        // Accumulate color weighted by intensity
        const w = intensity;
        blendR += mapping.color.r * w;
        blendG += mapping.color.g * w;
        blendB += mapping.color.b * w;
        totalWeight += w;
        maxIntensity = Math.max(maxIntensity, intensity);
      }

      // Normalize color
      if (totalWeight > 0) {
        blendR /= totalWeight;
        blendG /= totalWeight;
        blendB /= totalWeight;
      }

      // On peak, boost brightness towards white for that "flash" effect
      if (maxIntensity > 0.8) {
        const flash = (maxIntensity - 0.8) * 5; // 0-1 over the 0.8-1.0 range
        blendR = blendR + (255 - blendR) * flash * 0.3;
        blendG = blendG + (255 - blendG) * flash * 0.3;
        blendB = blendB + (255 - blendB) * flash * 0.3;
      }

      const beamAngle = this.computeBeamAngle(fixture, maxIntensity);

      results[fixture.id] = {
        color: {
          r: Math.round(Math.min(255, blendR)),
          g: Math.round(Math.min(255, blendG)),
          b: Math.round(Math.min(255, blendB)),
        },
        intensity: maxIntensity,
        beamAngle,
        position: fixture.position,
      };
    }

    return results;
  }

  /**
   * Shape the audio signal based on animation style.
   * The output is always proportional to the input signal —
   * these just add character to HOW the light responds.
   */
  private shapeSignal(
    style: AnimationStyle,
    signal: number,
    fixture: Fixture,
    analysis: StemAnalysis,
  ): number {
    const beatRate = this.bpm / 60;
    const phase = (this.time * beatRate * fixture.pulseRate) % 1;

    switch (style) {
      case 'strobe': {
        // Hard flash on peaks — light is either FULL ON or OFF
        // When the instrument is loud, it strobes; when quiet, off
        if (signal < 0.15) return 0;
        if (analysis.isPeak || analysis.isOnset) return signal; // Full signal on hit
        return signal * (phase < 0.08 ? 1 : 0); // Rapid on/off
      }

      case 'pulse': {
        // Smooth pulsing that follows the instrument's loudness
        // The signal IS the envelope — just add a subtle sine wobble
        const wobble = 0.85 + 0.15 * Math.sin(phase * Math.PI * 2);
        return signal * wobble;
      }

      case 'fade': {
        // Smooth, slow response — good for ambient washes
        // Signal is already smoothed in AudioEngine, just use it directly
        return signal;
      }

      case 'sweep': {
        // Moving beams that intensify with the signal
        const sweep = 0.5 + 0.5 * Math.sin(this.time * 1.5 + fixture.position.x * 3);
        return signal * sweep;
      }

      case 'chase': {
        // Lights take turns based on position, intensity follows signal
        const posOffset = (fixture.position.x + fixture.position.z) * 2;
        const chasePos = (this.time * beatRate + posOffset) % 1;
        const envelope = chasePos < 0.25 ? 1 : 0.05;
        return signal * envelope;
      }

      case 'random': {
        // Random flicker weighted by signal — louder = more flicker
        const rnd = Math.sin(this.time * 23.7 + fixture.position.x * 57) * 0.5 + 0.5;
        return signal * (0.3 + 0.7 * rnd);
      }

      case 'breath': {
        // Organic breathing that inflates with the instrument volume
        const breath = Math.pow(0.5 + 0.5 * Math.sin(this.time * 0.8), 2);
        return signal * (0.4 + 0.6 * breath);
      }

      case 'wave': {
        // Sine wave that modulates the signal
        const wave = 0.5 + 0.5 * Math.sin(this.time * beatRate * Math.PI);
        return signal * wave;
      }

      default:
        return signal;
    }
  }

  /** Compute beam angle — beams move faster when their instrument is louder */
  private computeBeamAngle(fixture: Fixture, intensity: number): number {
    if (fixture.type !== 'beam' && fixture.type !== 'spot') return 0;
    const speed = fixture.movementSpeed * (0.5 + intensity * 1.5);
    return Math.sin(this.time * speed * 2) * 45;
  }
}

export const lightingEngine = new LightingEngine();
