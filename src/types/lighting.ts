// ================================================================
// LIGHTING TYPES — Fixture definitions, mappings, and presets
// ================================================================

import { StemType } from './audio';

/** Types of lighting fixtures */
export type FixtureType = 'strobe' | 'spot' | 'wash' | 'beam' | 'laser' | 'led_bar' | 'par';

/** Animation style for a fixture */
export type AnimationStyle = 
  | 'pulse'      // Smooth on/off pulsing
  | 'strobe'     // Hard on/off flashing
  | 'fade'       // Slow fade in/out
  | 'sweep'      // Moving beam sweep
  | 'chase'      // Sequential light chase
  | 'random'     // Random flickering
  | 'breath'     // Organic breathing pattern
  | 'wave';      // Sine wave modulation

/** RGB color */
export interface LightColor {
  r: number; // 0-255
  g: number;
  b: number;
}

/** A single lighting fixture definition */
export interface Fixture {
  id: string;
  type: FixtureType;
  label: string;
  /** Position on stage (normalized 0-1) */
  position: { x: number; y: number; z: number };
  /** Current state */
  color: LightColor;
  intensity: number;     // 0-1
  beamWidth: number;     // degrees 5-120
  movementSpeed: number; // 0-1
  animationStyle: AnimationStyle;
  /** Pulse rate multiplier relative to BPM */
  pulseRate: number;
  /** Bloom/glow amount */
  bloom: number;         // 0-1
  /** Fade curve exponent */
  fadeCurve: number;     // 0.1-5
}

/** Mapping from an instrument stem to lighting fixtures */
export interface LightMapping {
  id: string;
  stemType: StemType;
  fixtureIds: string[];
  /** Audio parameter that drives the light */
  trigger: 'loudness' | 'peak' | 'onset' | 'spectral' | 'rhythm';
  /** Sensitivity multiplier */
  sensitivity: number;   // 0.1-5
  /** Color assigned to this mapping */
  color: LightColor;
  /** Animation style */
  animationStyle: AnimationStyle;
  /** Whether this mapping is active */
  enabled: boolean;
}

/** Saved lighting preset */
export interface LightingPreset {
  id: string;
  name: string;
  description: string;
  fixtures: Fixture[];
  mappings: LightMapping[];
  createdAt: number;
}

/** Stage environment settings */
export interface StageConfig {
  fogDensity: number;     // 0-1
  fogColor: LightColor;
  ambientIntensity: number; // 0-1
  stageWidth: number;
  stageDepth: number;
  hazeEnabled: boolean;
  laserEnabled: boolean;
  bloomIntensity: number;  // 0-5
  bloomThreshold: number;  // 0-1
}

/** Fixture type display config */
export const FIXTURE_CONFIG: Record<FixtureType, { label: string; icon: string; defaultBeamWidth: number }> = {
  strobe:  { label: 'Strobe',  icon: '⚡', defaultBeamWidth: 120 },
  spot:    { label: 'Spot',    icon: '◎',  defaultBeamWidth: 25 },
  wash:    { label: 'Wash',    icon: '◐',  defaultBeamWidth: 90 },
  beam:    { label: 'Beam',    icon: '│',  defaultBeamWidth: 5 },
  laser:   { label: 'Laser',   icon: '╱',  defaultBeamWidth: 2 },
  led_bar: { label: 'LED Bar', icon: '▬',  defaultBeamWidth: 60 },
  par:     { label: 'PAR Can', icon: '○',  defaultBeamWidth: 45 },
};
