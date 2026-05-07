// ================================================================
// Transport Bar — DAW-style playback controls and timeline
// Always visible at the bottom of the application.
// ================================================================

import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { useAudioStore } from '../../stores/audioStore';

/** Format seconds to MM:SS.ms */
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const TransportBar: React.FC = () => {
  const { togglePlay, seek, setVolume, isPlaying, currentTime, duration, bpm, isLoaded } = useAudioEngine();
  const volume = useAudioStore((s) => s.volume);
  const masterWaveform = useAudioStore((s) => s.masterWaveform);
  const fileName = useAudioStore((s) => s.fileName);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !isLoaded) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  }, [duration, isLoaded, seek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-16 bg-brutal-surface border-t-3 border-brutal-border flex items-center px-4 gap-4 shrink-0">
      {/* Play/Pause */}
      <motion.button
        onClick={togglePlay}
        disabled={!isLoaded}
        className={`
          w-10 h-10 border-3 flex items-center justify-center font-mono text-lg
          transition-all shrink-0
          ${isLoaded
            ? 'border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-brutal-bg cursor-pointer'
            : 'border-brutal-border text-brutal-muted cursor-not-allowed'
          }
        `}
        whileHover={isLoaded ? { scale: 1.05 } : {}}
        whileTap={isLoaded ? { scale: 0.95 } : {}}
      >
        {isPlaying ? '❚❚' : '▶'}
      </motion.button>

      {/* Stop */}
      <motion.button
        onClick={() => seek(0)}
        disabled={!isLoaded}
        className={`
          w-10 h-10 border-3 flex items-center justify-center font-mono text-sm shrink-0
          ${isLoaded
            ? 'border-brutal-border text-brutal-muted hover:text-brutal-text cursor-pointer'
            : 'border-brutal-border text-brutal-muted/30 cursor-not-allowed'
          }
        `}
        whileHover={isLoaded ? { scale: 1.05 } : {}}
        whileTap={isLoaded ? { scale: 0.95 } : {}}
      >
        ■
      </motion.button>

      {/* Time display */}
      <div className="font-mono text-sm shrink-0 w-40 flex items-center gap-1">
        <span className="text-accent-cyan">{formatTime(currentTime)}</span>
        <span className="text-brutal-muted">/</span>
        <span className="text-brutal-muted">{formatTime(duration)}</span>
      </div>

      {/* Seek bar with mini waveform */}
      <div
        ref={seekBarRef}
        className="flex-1 h-8 bg-brutal-bg border-3 border-brutal-border relative cursor-pointer overflow-hidden group"
        onClick={handleSeek}
      >
        {/* Mini waveform visualization */}
        <div className="absolute inset-0 flex items-center px-1">
          {Array.from({ length: 64 }).map((_, i) => {
            const val = masterWaveform[i * 4] || 0;
            const h = Math.abs(val) * 100;
            return (
              <div
                key={i}
                className="flex-1 flex items-center justify-center"
              >
                <div
                  className="w-full bg-brutal-border transition-all duration-75"
                  style={{
                    height: `${Math.max(2, h)}%`,
                    backgroundColor: (i / 64) * 100 < progress ? 'rgba(0, 255, 204, 0.4)' : 'rgba(255,255,255,0.08)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Progress overlay */}
        <div
          className="absolute top-0 left-0 h-full bg-accent-cyan/10 border-r-2 border-accent-cyan transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-accent-cyan z-10"
          style={{ left: `${progress}%` }}
        />

        {/* Hover effect */}
        <div className="absolute inset-0 bg-accent-cyan/0 group-hover:bg-accent-cyan/5 transition-colors" />
      </div>

      {/* BPM Display */}
      <div className="shrink-0 border-3 border-brutal-border px-3 py-1 bg-brutal-bg">
        <div className="font-mono text-[9px] uppercase text-brutal-muted tracking-wider">BPM</div>
        <div className={`font-mono text-lg font-bold ${bpm > 0 ? 'text-accent-red' : 'text-brutal-muted'}`}>
          {bpm > 0 ? bpm : '---'}
        </div>
      </div>

      {/* Volume */}
      <div className="shrink-0 flex items-center gap-2 w-32">
        <span className="font-mono text-[10px] text-brutal-muted">VOL</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="font-mono text-xs text-brutal-muted w-8 text-right">
          {Math.round(volume * 100)}
        </span>
      </div>

      {/* File name */}
      <div className="shrink-0 hidden xl:block">
        <div className="font-mono text-[9px] text-brutal-muted uppercase tracking-wider truncate max-w-40">
          {fileName || 'NO FILE'}
        </div>
      </div>
    </div>
  );
};
