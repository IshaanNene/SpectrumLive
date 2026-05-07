// ================================================================
// Dashboard — Command center overview page
// Shows audio status, stem levels, lighting overview, and 3D preview.
// ================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '../stores/audioStore';
import { useLightingStore } from '../stores/lightingStore';
import { STEM_TYPES, STEM_CONFIG, StemType } from '../types/audio';
import { SpectrumAnalyzer } from '../components/audio/SpectrumAnalyzer';
import { StemMeter } from '../components/audio/StemMeter';
import { StageVisualizer } from '../three/StageVisualizer';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export const Dashboard: React.FC = () => {
  const audioState = useAudioStore();
  const fixtures = useLightingStore((s) => s.fixtures);
  const mappings = useLightingStore((s) => s.mappings);

  return (
    <motion.div
      className="h-full overflow-auto grid-bg p-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-12 gap-3 h-full">
        {/* ─── 3D Stage Preview ─────────────────────── */}
        <motion.div
          className="col-span-8 row-span-2 brutal-panel overflow-hidden"
          variants={itemVariants}
        >
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">
              ◎ LIVE STAGE PREVIEW
            </span>
            <div className="flex-1" />
            <div className={`status-dot ${audioState.isPlaying ? 'active' : 'idle'}`} />
          </div>
          <div className="h-[calc(100%-32px)]">
            <StageVisualizer />
          </div>
        </motion.div>

        {/* ─── Audio Status ─────────────────────────── */}
        <motion.div className="col-span-4 brutal-panel p-4" variants={itemVariants}>
          <div className="brutal-header">⎆ AUDIO STATUS</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-brutal-muted">FILE</span>
              <span className="font-mono text-xs text-accent-cyan truncate max-w-32">
                {audioState.fileName || 'NONE'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-brutal-muted">STATE</span>
              <span className={`font-mono text-xs ${audioState.isPlaying ? 'text-accent-green' : 'text-brutal-muted'}`}>
                {audioState.isPlaying ? '▶ PLAYING' : '■ STOPPED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-brutal-muted">BPM</span>
              <span className="font-mono text-lg font-bold text-accent-red">
                {audioState.bpm || '---'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-brutal-muted">STEMS</span>
              <span className={`font-mono text-xs ${audioState.stemsReady ? 'text-accent-green' : 'text-brutal-muted'}`}>
                {audioState.stemsReady ? '7/7 READY' : 'NOT LOADED'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-brutal-muted">FIXTURES</span>
              <span className="font-mono text-xs text-accent-purple">{fixtures.length} ACTIVE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-brutal-muted">MAPPINGS</span>
              <span className="font-mono text-xs text-accent-orange">
                {mappings.filter(m => m.enabled).length} / {mappings.length}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── Master Spectrum ──────────────────────── */}
        <motion.div className="col-span-4 brutal-panel" variants={itemVariants}>
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">
              ⊞ MASTER SPECTRUM
            </span>
          </div>
          <div className="p-2 flex items-center justify-center">
            <SpectrumAnalyzer width={320} height={100} barCount={48} />
          </div>
        </motion.div>

        {/* ─── Stem Levels Overview ─────────────────── */}
        <motion.div className="col-span-12 brutal-panel" variants={itemVariants}>
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">
              ⌸ STEM LEVELS
            </span>
          </div>
          <div className="grid grid-cols-7 divide-x-3 divide-brutal-border">
            {STEM_TYPES.map((stem) => (
              <StemMeter key={stem} stemType={stem} compact />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
