// ================================================================
// LiveStage — Fullscreen 3D stage view with overlay controls
// ================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageVisualizer } from '../three/StageVisualizer';
import { useAudioStore } from '../stores/audioStore';
import { useLightingStore } from '../stores/lightingStore';
import { STEM_TYPES, STEM_CONFIG } from '../types/audio';

export const LiveStage: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(true);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const bpm = useAudioStore((s) => s.bpm);
  const stemAnalysis = useAudioStore((s) => s.stemAnalysis);
  const stageConfig = useLightingStore((s) => s.stageConfig);

  return (
    <div className="h-full relative">
      {/* Fullscreen 3D Stage */}
      <StageVisualizer className="absolute inset-0" />

      {/* Toggle overlay */}
      <button
        className="absolute top-3 right-3 z-20 brutal-btn text-[10px]"
        onClick={() => setShowOverlay(!showOverlay)}
      >
        {showOverlay ? '◻ HIDE HUD' : '◼ SHOW HUD'}
      </button>

      {/* HUD Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <>
            {/* Top-left: Status */}
            <motion.div
              className="absolute top-3 left-3 z-10 bg-brutal-bg/80 border-3 border-brutal-border backdrop-blur-sm p-3 min-w-48"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <div className="font-mono text-[9px] text-brutal-muted uppercase tracking-widest mb-2">LIVE STATUS</div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`status-dot ${isPlaying ? 'active' : 'idle'}`} />
                <span className="font-mono text-xs text-brutal-text">{isPlaying ? 'STREAMING' : 'STANDBY'}</span>
              </div>
              {bpm > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-brutal-muted">BPM</span>
                  <span className="font-mono text-lg font-bold text-accent-red">{bpm}</span>
                </div>
              )}
            </motion.div>

            {/* Bottom: Stem activity bars */}
            <motion.div
              className="absolute bottom-3 left-3 right-3 z-10 bg-brutal-bg/80 border-3 border-brutal-border backdrop-blur-sm p-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="grid grid-cols-7 gap-2">
                {STEM_TYPES.map(stem => {
                  const cfg = STEM_CONFIG[stem];
                  const analysis = stemAnalysis[stem];
                  return (
                    <div key={stem}>
                      <div className="font-mono text-[8px] text-brutal-muted uppercase text-center mb-1">{cfg.label}</div>
                      <div className="h-4 bg-brutal-bg border border-brutal-border overflow-hidden">
                        <div
                          className="h-full transition-all duration-75"
                          style={{ width: `${analysis.loudness * 100}%`, backgroundColor: cfg.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Stage controls */}
            <motion.div
              className="absolute top-3 right-14 z-10 bg-brutal-bg/80 border-3 border-brutal-border backdrop-blur-sm p-3 w-44"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
            >
              <div className="font-mono text-[9px] text-brutal-muted uppercase tracking-widest mb-2">STAGE</div>
              <div className="space-y-2">
                <div>
                  <label className="font-mono text-[8px] text-brutal-muted">BLOOM {stageConfig.bloomIntensity.toFixed(1)}</label>
                  <input type="range" min="0" max="5" step="0.1" value={stageConfig.bloomIntensity}
                    onChange={(e) => useLightingStore.getState().updateStageConfig({ bloomIntensity: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="font-mono text-[8px] text-brutal-muted">FOG {(stageConfig.fogDensity * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="1" step="0.05" value={stageConfig.fogDensity}
                    onChange={(e) => useLightingStore.getState().updateStageConfig({ fogDensity: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={stageConfig.hazeEnabled}
                    onChange={(e) => useLightingStore.getState().updateStageConfig({ hazeEnabled: e.target.checked })}
                    className="w-3 h-3" />
                  <span className="font-mono text-[9px] text-brutal-muted uppercase">Haze</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={stageConfig.laserEnabled}
                    onChange={(e) => useLightingStore.getState().updateStageConfig({ laserEnabled: e.target.checked })}
                    className="w-3 h-3" />
                  <span className="font-mono text-[9px] text-brutal-muted uppercase">Lasers</span>
                </label>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
