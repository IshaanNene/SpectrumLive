// ================================================================
// AudioImport — Drag-and-drop MP3 import with waveform preview
// ================================================================

import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useAudioStore } from '../stores/audioStore';
import { SpectrumAnalyzer } from '../components/audio/SpectrumAnalyzer';

export const AudioImport: React.FC = () => {
  const { loadFile, togglePlay, isLoaded, isPlaying, fileName, duration, bpm } = useAudioEngine();
  const isSeparating = useAudioStore((s) => s.isSeparating);
  const separationProgress = useAudioStore((s) => s.separationProgress);
  const stemsReady = useAudioStore((s) => s.stemsReady);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
      alert('Unsupported file format. Please use MP3, WAV, OGG, FLAC, M4A, or AAC.');
      return;
    }
    setLoading(true);
    await loadFile(file);
    setLoading(false);
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="h-full overflow-auto grid-bg p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-display text-3xl font-bold text-brutal-text">AUDIO IMPORT</h1>
          <p className="font-mono text-xs text-brutal-muted mt-1 uppercase tracking-wider">
            Load an audio file to begin stem separation and analysis
          </p>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          className={`
            relative border-3 border-dashed p-16 text-center cursor-pointer
            transition-all duration-200
            ${isDragOver
              ? 'border-accent-cyan bg-accent-cyan/5 shadow-glow'
              : loading
                ? 'border-accent-yellow bg-accent-yellow/5'
                : 'border-brutal-border bg-brutal-panel hover:border-brutal-muted'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.005 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.flac,.m4a,.aac"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-4xl mb-4 animate-pulse">⟳</div>
                <div className="font-mono text-sm text-accent-yellow uppercase tracking-wider">
                  DECODING AUDIO...
                </div>
              </motion.div>
            ) : isDragOver ? (
              <motion.div
                key="dragover"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <div className="text-4xl mb-4">⎆</div>
                <div className="font-mono text-sm text-accent-cyan uppercase tracking-wider">
                  DROP TO IMPORT
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-5xl mb-4 text-brutal-muted">⎆</div>
                <div className="font-mono text-sm text-brutal-muted uppercase tracking-wider mb-2">
                  DRAG & DROP AUDIO FILE
                </div>
                <div className="font-mono text-[10px] text-brutal-muted/60">
                  MP3 · WAV · OGG · FLAC · M4A · AAC
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-brutal-muted" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brutal-muted" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brutal-muted" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-brutal-muted" />
        </motion.div>

        {/* File Info */}
        <AnimatePresence>
          {isLoaded && (
            <motion.div
              className="brutal-panel-accent"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                <div className="brutal-header">⎆ LOADED FILE</div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  {/* File name */}
                  <div className="brutal-panel p-3">
                    <div className="font-mono text-[9px] text-brutal-muted uppercase">FILE</div>
                    <div className="font-mono text-sm text-accent-cyan truncate mt-1">{fileName}</div>
                  </div>

                  {/* Duration */}
                  <div className="brutal-panel p-3">
                    <div className="font-mono text-[9px] text-brutal-muted uppercase">DURATION</div>
                    <div className="font-mono text-sm text-brutal-text mt-1">{formatDuration(duration)}</div>
                  </div>

                  {/* BPM */}
                  <div className="brutal-panel p-3">
                    <div className="font-mono text-[9px] text-brutal-muted uppercase">BPM</div>
                    <div className="font-mono text-lg font-bold text-accent-red mt-1">{bpm || '...'}</div>
                  </div>

                  {/* Status */}
                  <div className="brutal-panel p-3">
                    <div className="font-mono text-[9px] text-brutal-muted uppercase">STATUS</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`status-dot ${isPlaying ? 'active' : stemsReady ? 'active' : 'warning'}`} />
                      <span className={`font-mono text-xs ${isPlaying ? 'text-accent-green' : stemsReady ? 'text-accent-green' : 'text-accent-yellow'}`}>
                        {isPlaying ? 'PLAYING' : stemsReady ? 'READY' : 'PROCESSING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Separation progress */}
                {isSeparating && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-accent-yellow uppercase tracking-wider animate-pulse">
                        ⟳ SEPARATING STEMS...
                      </span>
                      <span className="font-mono text-sm text-accent-yellow">
                        {Math.round(separationProgress * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-brutal-bg border-3 border-brutal-border overflow-hidden">
                      <motion.div
                        className="h-full bg-accent-yellow"
                        animate={{ width: `${separationProgress * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <div className="font-mono text-[9px] text-brutal-muted mt-1">
                      AI-powered stem separation in progress — drums, bass, vocals, guitar, synth, piano, other
                    </div>
                  </div>
                )}

                {/* Spectrum */}
                <div className="brutal-panel p-3">
                  <div className="font-mono text-[9px] text-brutal-muted uppercase mb-2">LIVE SPECTRUM</div>
                  <SpectrumAnalyzer width={700} height={120} barCount={96} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={togglePlay}
                    className={`brutal-btn-primary px-6 py-3 text-sm ${!stemsReady && !isLoaded ? 'opacity-50' : ''}`}
                  >
                    {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="brutal-btn px-6 py-3 text-sm"
                  >
                    ↻ LOAD NEW FILE
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
