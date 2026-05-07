// ================================================================
// LightingMapper — Instrument-to-fixture mapping editor
// ================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLightingStore } from '../stores/lightingStore';
import { useAudioStore } from '../stores/audioStore';
import { STEM_CONFIG, StemType, STEM_TYPES } from '../types/audio';
import { FIXTURE_CONFIG, AnimationStyle } from '../types/lighting';

const ANIMATION_STYLES: AnimationStyle[] = ['pulse', 'strobe', 'fade', 'sweep', 'chase', 'random', 'breath', 'wave'];

export const LightingMapper: React.FC = () => {
  const mappings = useLightingStore((s) => s.mappings);
  const fixtures = useLightingStore((s) => s.fixtures);
  const fixtureStates = useLightingStore((s) => s.fixtureStates);
  const stageConfig = useLightingStore((s) => s.stageConfig);
  const stemAnalysis = useAudioStore((s) => s.stemAnalysis);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  return (
    <motion.div className="h-full overflow-auto grid-bg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brutal-text">LIGHT MAPPER</h1>
          <p className="font-mono text-[10px] text-brutal-muted uppercase tracking-wider">
            Instrument → Fixture routing & animation controls
          </p>
        </div>
        <div className="flex gap-2">
          <button className="brutal-btn text-[10px]" onClick={() => useLightingStore.getState().loadDefaultSetup()}>
            ↻ RESET DEFAULTS
          </button>
          <button className="brutal-btn-primary text-[10px]" onClick={() => useLightingStore.getState().savePreset('Custom', 'User preset')}>
            ✦ SAVE PRESET
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 h-[calc(100%-60px)]">
        {/* Mapping list */}
        <div className="col-span-5 brutal-panel overflow-auto">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">ROUTING TABLE</span>
          </div>
          <div className="divide-y-3 divide-brutal-border">
            {mappings.map((mapping, idx) => {
              const stemCfg = STEM_CONFIG[mapping.stemType];
              const analysis = stemAnalysis[mapping.stemType];
              const isSelected = selectedMapping === mapping.id;

              return (
                <motion.div
                  key={mapping.id}
                  className={`p-3 cursor-pointer transition-all ${isSelected ? 'bg-brutal-bg' : 'hover:bg-brutal-bg/50'}`}
                  onClick={() => setSelectedMapping(mapping.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {/* Enable toggle */}
                    <button
                      className={`w-4 h-4 border-2 flex items-center justify-center text-[8px] ${mapping.enabled ? 'border-accent-green bg-accent-green/20 text-accent-green' : 'border-brutal-border text-brutal-muted'}`}
                      onClick={(e) => { e.stopPropagation(); useLightingStore.getState().updateMapping(mapping.id, { enabled: !mapping.enabled }); }}
                    >
                      {mapping.enabled ? '✓' : ''}
                    </button>

                    {/* Stem label */}
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: stemCfg.color }}>{stemCfg.icon}</span>
                      <span className="font-mono text-xs uppercase" style={{ color: stemCfg.color }}>{stemCfg.label}</span>
                    </div>

                    <span className="font-mono text-brutal-muted text-xs">→</span>

                    {/* Fixture count */}
                    <span className="font-mono text-[10px] text-brutal-text">
                      {mapping.fixtureIds.length} fixtures
                    </span>

                    {/* Live level */}
                    <div className="ml-auto w-16 h-3 bg-brutal-bg border border-brutal-border overflow-hidden">
                      <div className="h-full transition-all duration-75" style={{ width: `${analysis.loudness * 100}%`, backgroundColor: stemCfg.color }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="brutal-tag" style={{ borderColor: stemCfg.color, color: stemCfg.color }}>{mapping.animationStyle}</span>
                    <span className="brutal-tag">{mapping.trigger}</span>
                    <span className="font-mono text-brutal-muted">sens: {mapping.sensitivity.toFixed(1)}x</span>
                    <div className="w-3 h-3 border border-brutal-border ml-auto" style={{ backgroundColor: rgbToHex(mapping.color.r, mapping.color.g, mapping.color.b) }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mapping editor */}
        <div className="col-span-4 brutal-panel overflow-auto">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">EDIT MAPPING</span>
          </div>
          {selectedMapping ? (() => {
            const mapping = mappings.find(m => m.id === selectedMapping);
            if (!mapping) return null;
            const stemCfg = STEM_CONFIG[mapping.stemType];

            return (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ color: stemCfg.color }} className="text-lg">{stemCfg.icon}</span>
                  <span className="font-display text-lg font-bold" style={{ color: stemCfg.color }}>{stemCfg.label}</span>
                </div>

                {/* Color */}
                <div>
                  <label className="font-mono text-[9px] text-brutal-muted uppercase block mb-1">Color</label>
                  <input type="color" value={rgbToHex(mapping.color.r, mapping.color.g, mapping.color.b)}
                    onChange={(e) => useLightingStore.getState().updateMapping(mapping.id, { color: hexToRgb(e.target.value) })}
                    className="w-full h-8 bg-brutal-bg border-3 border-brutal-border cursor-pointer" />
                </div>

                {/* Animation style */}
                <div>
                  <label className="font-mono text-[9px] text-brutal-muted uppercase block mb-1">Animation</label>
                  <div className="grid grid-cols-4 gap-1">
                    {ANIMATION_STYLES.map(style => (
                      <button key={style}
                        className={`font-mono text-[9px] uppercase py-1.5 border-2 transition-all ${mapping.animationStyle === style ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10' : 'border-brutal-border text-brutal-muted hover:text-brutal-text'}`}
                        onClick={() => useLightingStore.getState().updateMapping(mapping.id, { animationStyle: style })}
                      >{style}</button>
                    ))}
                  </div>
                </div>

                {/* Trigger */}
                <div>
                  <label className="font-mono text-[9px] text-brutal-muted uppercase block mb-1">Trigger</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['loudness', 'peak', 'onset', 'spectral', 'rhythm'] as const).map(t => (
                      <button key={t}
                        className={`font-mono text-[9px] uppercase py-1.5 border-2 transition-all ${mapping.trigger === t ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10' : 'border-brutal-border text-brutal-muted hover:text-brutal-text'}`}
                        onClick={() => useLightingStore.getState().updateMapping(mapping.id, { trigger: t })}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Sensitivity */}
                <div>
                  <label className="font-mono text-[9px] text-brutal-muted uppercase block mb-1">
                    Sensitivity: {mapping.sensitivity.toFixed(1)}x
                  </label>
                  <input type="range" min="0.1" max="5" step="0.1" value={mapping.sensitivity}
                    onChange={(e) => useLightingStore.getState().updateMapping(mapping.id, { sensitivity: parseFloat(e.target.value) })}
                    className="w-full" />
                </div>
              </div>
            );
          })() : (
            <div className="p-8 text-center font-mono text-xs text-brutal-muted">Select a mapping to edit</div>
          )}
        </div>

        {/* Fixture overview */}
        <div className="col-span-3 brutal-panel overflow-auto">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">FIXTURES ({fixtures.length})</span>
          </div>
          <div className="p-2 space-y-1">
            {fixtures.map(f => {
              const state = fixtureStates[f.id];
              const fCfg = FIXTURE_CONFIG[f.type];
              return (
                <div key={f.id} className="flex items-center gap-2 p-1.5 bg-brutal-bg border border-brutal-border">
                  <div className="w-3 h-3 rounded-full border border-brutal-border" style={{
                    backgroundColor: state ? `rgb(${state.color.r},${state.color.g},${state.color.b})` : '#222',
                    opacity: state ? 0.3 + state.intensity * 0.7 : 0.1,
                    boxShadow: state && state.intensity > 0.3 ? `0 0 6px rgb(${state.color.r},${state.color.g},${state.color.b})` : 'none',
                  }} />
                  <span className="font-mono text-[9px] text-brutal-muted">{fCfg.icon}</span>
                  <span className="font-mono text-[9px] text-brutal-text truncate flex-1">{f.label}</span>
                  <span className="font-mono text-[8px] text-brutal-muted">{state ? Math.round(state.intensity * 100) : 0}%</span>
                </div>
              );
            })}
          </div>

          {/* Stage config */}
          <div className="p-3 border-t-3 border-brutal-border space-y-2">
            <div className="font-mono text-[9px] text-brutal-muted uppercase">Stage Settings</div>
            <div>
              <label className="font-mono text-[8px] text-brutal-muted">Fog: {(stageConfig.fogDensity * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="1" step="0.05" value={stageConfig.fogDensity}
                onChange={(e) => useLightingStore.getState().updateStageConfig({ fogDensity: parseFloat(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="font-mono text-[8px] text-brutal-muted">Bloom: {stageConfig.bloomIntensity.toFixed(1)}</label>
              <input type="range" min="0" max="5" step="0.1" value={stageConfig.bloomIntensity}
                onChange={(e) => useLightingStore.getState().updateStageConfig({ bloomIntensity: parseFloat(e.target.value) })} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
