// ================================================================
// LIGHTING STORE — Global lighting state, fixtures, and mappings (Zustand)
// ================================================================

import { create } from 'zustand';
import {
  Fixture, FixtureType, LightMapping, LightingPreset,
  StageConfig, LightColor, AnimationStyle,
} from '../types/lighting';
import { StemType } from '../types/audio';

interface LightingStore {
  fixtures: Fixture[];
  mappings: LightMapping[];
  presets: LightingPreset[];
  activePresetId: string | null;
  stageConfig: StageConfig;

  // Real-time computed fixture states (updated by lighting engine)
  fixtureStates: Record<string, { color: LightColor; intensity: number }>;

  // Actions
  addFixture: (fixture: Fixture) => void;
  removeFixture: (id: string) => void;
  updateFixture: (id: string, updates: Partial<Fixture>) => void;
  addMapping: (mapping: LightMapping) => void;
  removeMapping: (id: string) => void;
  updateMapping: (id: string, updates: Partial<LightMapping>) => void;
  updateStageConfig: (config: Partial<StageConfig>) => void;
  updateFixtureState: (id: string, state: { color: LightColor; intensity: number }) => void;
  batchUpdateFixtureStates: (states: Record<string, { color: LightColor; intensity: number }>) => void;
  savePreset: (name: string, description: string) => void;
  loadPreset: (id: string) => void;
  loadDefaultSetup: () => void;
}

/** Generate unique ID */
const uid = () => Math.random().toString(36).slice(2, 10);

/** Create a default fixture */
const createFixture = (
  type: FixtureType,
  label: string,
  pos: { x: number; y: number; z: number },
  color: LightColor = { r: 255, g: 255, b: 255 }
): Fixture => ({
  id: uid(),
  type,
  label,
  position: pos,
  color,
  intensity: 0.8,
  beamWidth: type === 'beam' ? 5 : type === 'laser' ? 2 : type === 'wash' ? 90 : 30,
  movementSpeed: 0.5,
  animationStyle: 'pulse',
  pulseRate: 1,
  bloom: 0.6,
  fadeCurve: 1,
});

/** Default concert stage fixtures */
const defaultFixtures: Fixture[] = [
  // Front trusses — strobes
  createFixture('strobe', 'Front Strobe L', { x: -0.6, y: 0.9, z: 0.3 }, { r: 255, g: 255, b: 255 }),
  createFixture('strobe', 'Front Strobe C', { x: 0, y: 0.95, z: 0.3 }, { r: 255, g: 255, b: 255 }),
  createFixture('strobe', 'Front Strobe R', { x: 0.6, y: 0.9, z: 0.3 }, { r: 255, g: 255, b: 255 }),

  // Moving head beams
  createFixture('beam', 'Beam L1', { x: -0.8, y: 0.85, z: 0.5 }, { r: 0, g: 255, b: 204 }),
  createFixture('beam', 'Beam L2', { x: -0.4, y: 0.85, z: 0.5 }, { r: 170, g: 51, b: 255 }),
  createFixture('beam', 'Beam R1', { x: 0.4, y: 0.85, z: 0.5 }, { r: 170, g: 51, b: 255 }),
  createFixture('beam', 'Beam R2', { x: 0.8, y: 0.85, z: 0.5 }, { r: 0, g: 255, b: 204 }),

  // Wash lights
  createFixture('wash', 'Wash L', { x: -0.7, y: 0.7, z: 0.8 }, { r: 255, g: 204, b: 0 }),
  createFixture('wash', 'Wash C', { x: 0, y: 0.75, z: 0.8 }, { r: 255, g: 204, b: 0 }),
  createFixture('wash', 'Wash R', { x: 0.7, y: 0.7, z: 0.8 }, { r: 255, g: 204, b: 0 }),

  // Floor spots
  createFixture('spot', 'Floor Spot L', { x: -0.5, y: 0, z: 0.6 }, { r: 51, g: 102, b: 255 }),
  createFixture('spot', 'Floor Spot C', { x: 0, y: 0, z: 0.5 }, { r: 51, g: 102, b: 255 }),
  createFixture('spot', 'Floor Spot R', { x: 0.5, y: 0, z: 0.6 }, { r: 51, g: 102, b: 255 }),

  // LED bars
  createFixture('led_bar', 'LED Bar Back L', { x: -0.5, y: 0.3, z: 1 }, { r: 255, g: 51, b: 51 }),
  createFixture('led_bar', 'LED Bar Back C', { x: 0, y: 0.3, z: 1 }, { r: 255, g: 51, b: 51 }),
  createFixture('led_bar', 'LED Bar Back R', { x: 0.5, y: 0.3, z: 1 }, { r: 255, g: 51, b: 51 }),

  // Lasers
  createFixture('laser', 'Laser L', { x: -0.3, y: 0.9, z: 0.9 }, { r: 0, g: 255, b: 100 }),
  createFixture('laser', 'Laser R', { x: 0.3, y: 0.9, z: 0.9 }, { r: 0, g: 255, b: 100 }),

  // Side PAR cans
  createFixture('par', 'Side PAR L1', { x: -0.95, y: 0.5, z: 0.4 }, { r: 255, g: 102, b: 51 }),
  createFixture('par', 'Side PAR L2', { x: -0.95, y: 0.5, z: 0.7 }, { r: 255, g: 102, b: 51 }),
  createFixture('par', 'Side PAR R1', { x: 0.95, y: 0.5, z: 0.4 }, { r: 255, g: 102, b: 51 }),
  createFixture('par', 'Side PAR R2', { x: 0.95, y: 0.5, z: 0.7 }, { r: 255, g: 102, b: 51 }),
];

/** Default instrument-to-fixture mappings */
const createDefaultMappings = (fixtures: Fixture[]): LightMapping[] => {
  const byType = (type: FixtureType) => fixtures.filter(f => f.type === type).map(f => f.id);

  return [
    { id: uid(), stemType: 'drums', fixtureIds: byType('strobe'), trigger: 'peak', sensitivity: 1.5, color: { r: 255, g: 255, b: 255 }, animationStyle: 'strobe', enabled: true },
    { id: uid(), stemType: 'bass', fixtureIds: byType('spot'), trigger: 'loudness', sensitivity: 1.2, color: { r: 51, g: 102, b: 255 }, animationStyle: 'pulse', enabled: true },
    { id: uid(), stemType: 'vocals', fixtureIds: byType('wash'), trigger: 'loudness', sensitivity: 1.0, color: { r: 255, g: 204, b: 0 }, animationStyle: 'breath', enabled: true },
    { id: uid(), stemType: 'synth', fixtureIds: byType('beam'), trigger: 'spectral', sensitivity: 1.3, color: { r: 170, g: 51, b: 255 }, animationStyle: 'sweep', enabled: true },
    { id: uid(), stemType: 'guitar', fixtureIds: byType('par'), trigger: 'rhythm', sensitivity: 1.1, color: { r: 255, g: 102, b: 51 }, animationStyle: 'chase', enabled: true },
    { id: uid(), stemType: 'piano', fixtureIds: byType('led_bar'), trigger: 'spectral', sensitivity: 0.9, color: { r: 0, g: 255, b: 204 }, animationStyle: 'fade', enabled: true },
    { id: uid(), stemType: 'other', fixtureIds: byType('laser'), trigger: 'onset', sensitivity: 1.0, color: { r: 0, g: 255, b: 100 }, animationStyle: 'random', enabled: true },
  ];
};

const defaultStageConfig: StageConfig = {
  fogDensity: 0.4,
  fogColor: { r: 10, g: 10, b: 15 },
  ambientIntensity: 0.05,
  stageWidth: 20,
  stageDepth: 15,
  hazeEnabled: true,
  laserEnabled: true,
  bloomIntensity: 1.5,
  bloomThreshold: 0.3,
};

export const useLightingStore = create<LightingStore>((set, get) => ({
  fixtures: defaultFixtures,
  mappings: createDefaultMappings(defaultFixtures),
  presets: [],
  activePresetId: null,
  stageConfig: defaultStageConfig,
  fixtureStates: Object.fromEntries(
    defaultFixtures.map(f => [f.id, { color: { r: 0, g: 0, b: 0 }, intensity: 0 }])
  ),

  addFixture: (fixture) => set((s) => ({ fixtures: [...s.fixtures, fixture] })),
  removeFixture: (id) => set((s) => ({
    fixtures: s.fixtures.filter(f => f.id !== id),
    mappings: s.mappings.map(m => ({ ...m, fixtureIds: m.fixtureIds.filter(fid => fid !== id) })),
  })),
  updateFixture: (id, updates) => set((s) => ({
    fixtures: s.fixtures.map(f => f.id === id ? { ...f, ...updates } : f),
  })),

  addMapping: (mapping) => set((s) => ({ mappings: [...s.mappings, mapping] })),
  removeMapping: (id) => set((s) => ({ mappings: s.mappings.filter(m => m.id !== id) })),
  updateMapping: (id, updates) => set((s) => ({
    mappings: s.mappings.map(m => m.id === id ? { ...m, ...updates } : m),
  })),

  updateStageConfig: (config) => set((s) => ({
    stageConfig: { ...s.stageConfig, ...config },
  })),

  updateFixtureState: (id, state) => set((s) => ({
    fixtureStates: { ...s.fixtureStates, [id]: state },
  })),

  batchUpdateFixtureStates: (states) => set((s) => ({
    fixtureStates: { ...s.fixtureStates, ...states },
  })),

  savePreset: (name, description) => {
    const state = get();
    const preset: LightingPreset = {
      id: uid(),
      name,
      description,
      fixtures: JSON.parse(JSON.stringify(state.fixtures)),
      mappings: JSON.parse(JSON.stringify(state.mappings)),
      createdAt: Date.now(),
    };
    set((s) => ({ presets: [...s.presets, preset], activePresetId: preset.id }));
  },

  loadPreset: (id) => {
    const preset = get().presets.find(p => p.id === id);
    if (preset) {
      set({
        fixtures: JSON.parse(JSON.stringify(preset.fixtures)),
        mappings: JSON.parse(JSON.stringify(preset.mappings)),
        activePresetId: id,
      });
    }
  },

  loadDefaultSetup: () => set({
    fixtures: defaultFixtures,
    mappings: createDefaultMappings(defaultFixtures),
    stageConfig: defaultStageConfig,
    activePresetId: null,
  }),
}));
