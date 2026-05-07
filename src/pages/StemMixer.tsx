// ================================================================
// StemMixer — DAW-style channel strip mixer for separated stems
// ================================================================

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '../stores/audioStore';
import { STEM_TYPES, STEM_CONFIG, StemType } from '../types/audio';
import { SpectrumAnalyzer } from '../components/audio/SpectrumAnalyzer';

const ChannelStrip: React.FC<{ stemType: StemType; index: number }> = ({ stemType, index }) => {
  const analysis = useAudioStore((s) => s.stemAnalysis[stemType]);
  const mix = useAudioStore((s) => s.stemMixes[stemType]);
  const config = STEM_CONFIG[stemType];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf: number;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const waveform = useAudioStore.getState().stemAnalysis[stemType].waveformData;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const sw = canvas.width / waveform.length;
      for (let i = 0; i < waveform.length; i++) {
        const y = (waveform[i] * 0.5 + 0.5) * canvas.height;
        i === 0 ? ctx.moveTo(i * sw, y) : ctx.lineTo(i * sw, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [stemType, config.color]);

  const db = analysis.loudness > 0 ? (20 * Math.log10(analysis.loudness)).toFixed(1) : '-∞';

  return (
    <motion.div
      className="brutal-panel flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="h-10 border-b-3 border-brutal-border flex items-center px-3 gap-2" style={{ borderTopColor: config.color, borderTopWidth: '3px' }}>
        <span style={{ color: config.color }}>{config.icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-brutal-text">{config.label}</span>
        {analysis.isPeak && <div className="w-2 h-2 rounded-full bg-white ml-auto animate-flicker" />}
      </div>

      <div className="h-16 border-b-3 border-brutal-border p-1 bg-brutal-bg">
        <canvas ref={canvasRef} width={200} height={56} className="w-full h-full" />
      </div>

      <div className="flex-1 flex flex-col p-3 gap-2">
        <div className="flex-1 flex gap-2 min-h-[120px]">
          <div className="w-6 bg-brutal-bg border-2 border-brutal-border relative overflow-hidden">
            <motion.div className="absolute bottom-0 w-full" style={{ backgroundColor: config.color }} animate={{ height: `${analysis.loudness * 100}%` }} transition={{ duration: 0.05 }} />
            {analysis.loudness > 0.95 && <div className="absolute top-0 w-full h-1 bg-accent-red" />}
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <input type="range" min="0" max="1" step="0.01" value={mix.volume}
              onChange={(e) => useAudioStore.getState().setStemMix(stemType, { volume: parseFloat(e.target.value) })}
              className="w-full" style={{ accentColor: config.color }} />
            <span className="font-mono text-[10px] text-brutal-muted">{Math.round(mix.volume * 100)}%</span>
          </div>
        </div>

        <div className="flex gap-1 mt-1">
          {['LO', 'MID', 'HI'].map((label, idx) => (
            <div key={label} className="flex-1 text-center">
              <div className="font-mono text-[7px] text-brutal-muted mb-0.5">{label}</div>
              <div className="h-5 bg-brutal-bg border border-brutal-border relative overflow-hidden">
                <div className="absolute bottom-0 w-full transition-all duration-75" style={{ height: `${(analysis.spectralEnergy[idx] || 0) * 100}%`, backgroundColor: config.color, opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-1 border-t-2 border-brutal-border pt-1">
          <span className="font-mono text-sm font-bold" style={{ color: config.color }}>{db}</span>
          <span className="font-mono text-[8px] text-brutal-muted ml-1">dB</span>
        </div>

        <div className="flex gap-1 mt-1">
          <button className={`flex-1 font-mono text-[9px] uppercase py-1.5 border-3 transition-all ${mix.muted ? 'border-accent-red bg-accent-red/20 text-accent-red' : 'border-brutal-border text-brutal-muted hover:text-brutal-text'}`}
            onClick={() => useAudioStore.getState().setStemMix(stemType, { muted: !mix.muted })}>M</button>
          <button className={`flex-1 font-mono text-[9px] uppercase py-1.5 border-3 transition-all ${mix.solo ? 'border-accent-yellow bg-accent-yellow/20 text-accent-yellow' : 'border-brutal-border text-brutal-muted hover:text-brutal-text'}`}
            onClick={() => useAudioStore.getState().setStemMix(stemType, { solo: !mix.solo })}>S</button>
        </div>
      </div>
    </motion.div>
  );
};

export const StemMixer: React.FC = () => {
  const isLoaded = useAudioStore((s) => s.isLoaded);
  const stemsReady = useAudioStore((s) => s.stemsReady);

  return (
    <motion.div className="h-full overflow-auto grid-bg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-brutal-text">STEM MIXER</h1>
          <p className="font-mono text-[10px] text-brutal-muted uppercase tracking-wider">7-Channel instrument mixer</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`status-dot ${stemsReady ? 'active' : isLoaded ? 'warning' : 'idle'}`} />
          <span className="font-mono text-[10px] text-brutal-muted uppercase">{stemsReady ? 'STEMS ACTIVE' : 'NO AUDIO'}</span>
        </div>
      </div>

      <div className="brutal-panel mb-4">
        <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">MASTER OUTPUT</span>
        </div>
        <div className="p-3"><SpectrumAnalyzer width={1100} height={50} barCount={128} /></div>
      </div>

      <div className="grid grid-cols-7 gap-3" style={{ height: 'calc(100% - 160px)' }}>
        {STEM_TYPES.map((stem, idx) => <ChannelStrip key={stem} stemType={stem} index={idx} />)}
      </div>
    </motion.div>
  );
};
