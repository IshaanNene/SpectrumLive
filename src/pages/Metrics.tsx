// ================================================================
// Metrics — Performance monitoring dashboard
// ================================================================

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';
import { useAudioStore } from '../stores/audioStore';
import { useLightingStore } from '../stores/lightingStore';
import { STEM_TYPES, STEM_CONFIG } from '../types/audio';
import { SpectrumAnalyzer } from '../components/audio/SpectrumAnalyzer';

const FPSGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);
  const metrics = usePerformanceMetrics();

  useEffect(() => {
    historyRef.current.push(metrics.fps);
    if (historyRef.current.length > 200) historyRef.current.shift();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const h = historyRef.current;
    const maxFps = 120;
    const w = canvas.width / 200;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < canvas.height; y += canvas.height / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 60fps target line
    ctx.strokeStyle = 'rgba(51, 255, 102, 0.3)';
    ctx.setLineDash([4, 4]);
    const y60 = canvas.height - (60 / maxFps) * canvas.height;
    ctx.beginPath(); ctx.moveTo(0, y60); ctx.lineTo(canvas.width, y60); ctx.stroke();
    ctx.setLineDash([]);

    // FPS line
    ctx.strokeStyle = metrics.fps >= 55 ? '#33ff66' : metrics.fps >= 30 ? '#ffcc00' : '#ff3333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < h.length; i++) {
      const x = i * w;
      const y = canvas.height - (Math.min(h[i], maxFps) / maxFps) * canvas.height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [metrics.fps]);

  return <canvas ref={canvasRef} width={500} height={100} className="w-full h-full" />;
};

export const Metrics: React.FC = () => {
  const metrics = usePerformanceMetrics();
  const audioState = useAudioStore();
  const fixtures = useLightingStore((s) => s.fixtures);
  const mappings = useLightingStore((s) => s.mappings);
  const stemAnalysis = useAudioStore((s) => s.stemAnalysis);

  const fpsColor = metrics.fps >= 55 ? 'text-accent-green' : metrics.fps >= 30 ? 'text-accent-yellow' : 'text-accent-red';

  return (
    <motion.div className="h-full overflow-auto grid-bg p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-brutal-text">PERFORMANCE</h1>
        <p className="font-mono text-[10px] text-brutal-muted uppercase tracking-wider">System metrics & diagnostics</p>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* FPS Panel */}
        <div className="col-span-8 brutal-panel">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">FPS TIMELINE</span>
            <div className="flex-1" />
            <span className={`font-mono text-sm font-bold ${fpsColor}`}>{metrics.fps} FPS</span>
          </div>
          <div className="p-3 h-32"><FPSGraph /></div>
        </div>

        {/* Stats grid */}
        <div className="col-span-4 grid grid-rows-4 gap-3">
          {[
            { label: 'FRAME TIME', value: `${metrics.avgFrameTime.toFixed(2)}ms`, color: metrics.avgFrameTime < 17 ? 'text-accent-green' : 'text-accent-yellow' },
            { label: 'MIN / MAX FPS', value: `${metrics.minFps} / ${metrics.maxFps}`, color: 'text-brutal-text' },
            { label: 'GPU EST.', value: `${metrics.gpuTime.toFixed(1)}ms`, color: 'text-accent-purple' },
            { label: 'MEMORY', value: metrics.memoryUsage > 0 ? `${metrics.memoryUsage}MB` : 'N/A', color: 'text-accent-cyan' },
          ].map(stat => (
            <div key={stat.label} className="brutal-panel p-3 flex items-center justify-between">
              <span className="font-mono text-[9px] text-brutal-muted uppercase">{stat.label}</span>
              <span className={`font-mono text-sm font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* System overview */}
        <div className="col-span-4 brutal-panel">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">SYSTEM</span>
          </div>
          <div className="p-3 space-y-2">
            {[
              { label: 'Audio', value: audioState.isPlaying ? 'PLAYING' : 'STOPPED', dot: audioState.isPlaying ? 'active' : 'idle' },
              { label: 'Stems', value: audioState.stemsReady ? '7/7 READY' : 'PENDING', dot: audioState.stemsReady ? 'active' : 'warning' },
              { label: 'Fixtures', value: `${fixtures.length} ACTIVE`, dot: 'active' },
              { label: 'Mappings', value: `${mappings.filter(m => m.enabled).length} ENABLED`, dot: 'active' },
              { label: 'BPM', value: audioState.bpm > 0 ? `${audioState.bpm}` : '---', dot: audioState.bpm > 0 ? 'active' : 'idle' },
              { label: 'Latency', value: `${metrics.avgFrameTime.toFixed(1)}ms`, dot: metrics.avgFrameTime < 17 ? 'active' : 'warning' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`status-dot ${item.dot}`} />
                  <span className="font-mono text-[10px] text-brutal-muted uppercase">{item.label}</span>
                </div>
                <span className="font-mono text-xs text-brutal-text">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live spectrum */}
        <div className="col-span-8 brutal-panel">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">SPECTRUM ANALYZER</span>
          </div>
          <div className="p-3"><SpectrumAnalyzer width={700} height={100} barCount={128} /></div>
        </div>

        {/* Per-stem activity */}
        <div className="col-span-12 brutal-panel">
          <div className="h-8 bg-brutal-bg border-b-3 border-brutal-border flex items-center px-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-muted">STEM ACTIVITY</span>
          </div>
          <div className="p-3 grid grid-cols-7 gap-3">
            {STEM_TYPES.map(stem => {
              const cfg = STEM_CONFIG[stem];
              const analysis = stemAnalysis[stem];
              return (
                <div key={stem} className="text-center">
                  <span className="font-mono text-[9px] uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                  <div className="h-3 bg-brutal-bg border border-brutal-border mt-1 overflow-hidden">
                    <div className="h-full transition-all duration-75" style={{ width: `${analysis.loudness * 100}%`, backgroundColor: cfg.color }} />
                  </div>
                  <div className="font-mono text-[8px] text-brutal-muted mt-0.5">
                    {analysis.loudness > 0 ? `${(20 * Math.log10(analysis.loudness)).toFixed(0)}dB` : '-∞'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
