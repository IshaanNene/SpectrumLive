// ================================================================
// StemMeter — Per-stem level meter with color-coded bars
// Shows loudness, peak, and spectral energy for each stem.
// ================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '../../stores/audioStore';
import { StemType, STEM_CONFIG } from '../../types/audio';

interface StemMeterProps {
  stemType: StemType;
  compact?: boolean;
}

export const StemMeter: React.FC<StemMeterProps> = ({ stemType, compact = false }) => {
  const analysis = useAudioStore((s) => s.stemAnalysis[stemType]);
  const mix = useAudioStore((s) => s.stemMixes[stemType]);
  const config = STEM_CONFIG[stemType];

  const { loudness, isPeak, spectralEnergy } = analysis;

  return (
    <div className={`${compact ? 'p-2' : 'p-3'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: config.color }}
          >
            {config.icon}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-brutal-muted">
            {config.label}
          </span>
        </div>

        {/* Peak indicator */}
        {isPeak && (
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.15 }}
          />
        )}
      </div>

      {/* Loudness meter */}
      <div className="brutal-meter mb-1">
        <div
          className="brutal-meter-fill"
          style={{
            width: `${loudness * 100}%`,
            backgroundColor: isPeak ? '#ffffff' : config.color,
            boxShadow: isPeak ? `0 0 10px ${config.color}` : 'none',
          }}
        />
      </div>

      {!compact && (
        <>
          {/* Spectral energy bars */}
          <div className="flex gap-1 mt-2">
            {['L', 'M', 'H'].map((label, idx) => (
              <div key={label} className="flex-1">
                <div className="font-mono text-[8px] text-brutal-muted text-center mb-0.5">
                  {label}
                </div>
                <div className="h-12 bg-brutal-bg border border-brutal-border relative overflow-hidden">
                  <motion.div
                    className="absolute bottom-0 w-full"
                    style={{ backgroundColor: config.color }}
                    animate={{ height: `${(spectralEnergy[idx] || 0) * 100}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* dB readout */}
          <div className="font-mono text-[10px] text-right mt-1" style={{ color: config.color }}>
            {loudness > 0 ? `${(20 * Math.log10(loudness)).toFixed(1)} dB` : '-∞ dB'}
          </div>

          {/* Mute/Solo */}
          <div className="flex gap-1 mt-2">
            <button
              className={`flex-1 font-mono text-[9px] uppercase py-1 border-2 transition-all
                ${mix.muted
                  ? 'border-accent-red bg-accent-red/20 text-accent-red'
                  : 'border-brutal-border text-brutal-muted hover:text-brutal-text'
                }`}
              onClick={() => useAudioStore.getState().setStemMix(stemType, { muted: !mix.muted })}
            >
              M
            </button>
            <button
              className={`flex-1 font-mono text-[9px] uppercase py-1 border-2 transition-all
                ${mix.solo
                  ? 'border-accent-yellow bg-accent-yellow/20 text-accent-yellow'
                  : 'border-brutal-border text-brutal-muted hover:text-brutal-text'
                }`}
              onClick={() => useAudioStore.getState().setStemMix(stemType, { solo: !mix.solo })}
            >
              S
            </button>
          </div>
        </>
      )}
    </div>
  );
};
