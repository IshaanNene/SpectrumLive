// ================================================================
// TopBar — System status bar with performance info and clock
// ================================================================

import React from 'react';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';
import { useAudioStore } from '../../stores/audioStore';

interface TopBarProps {
  activePage: string;
}

export const TopBar: React.FC<TopBarProps> = ({ activePage }) => {
  const metrics = usePerformanceMetrics();
  const isSeparating = useAudioStore((s) => s.isSeparating);
  const separationProgress = useAudioStore((s) => s.separationProgress);
  const stemsReady = useAudioStore((s) => s.stemsReady);

  const pageTitle: Record<string, string> = {
    dashboard: 'COMMAND CENTER',
    import: 'AUDIO IMPORT',
    stems: 'STEM MIXER',
    lighting: 'LIGHT MAPPER',
    stage: 'LIVE STAGE',
    metrics: 'PERFORMANCE',
  };

  const fpsColor = metrics.fps >= 55 ? 'text-accent-green' : metrics.fps >= 30 ? 'text-accent-yellow' : 'text-accent-red';

  return (
    <div className="h-10 bg-brutal-surface border-b-3 border-brutal-border flex items-center px-4 gap-4 shrink-0">
      {/* Page title */}
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-brutal-muted">
        {pageTitle[activePage] || 'SYNESTHETIC STAGE'}
      </div>

      {/* Separator */}
      <div className="flex-1 h-px bg-brutal-border" />

      {/* Stem separation progress */}
      {isSeparating && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-accent-yellow uppercase animate-pulse">
            SEPARATING STEMS
          </span>
          <div className="w-20 h-2 bg-brutal-bg border border-brutal-border overflow-hidden">
            <div
              className="h-full bg-accent-yellow transition-all duration-200"
              style={{ width: `${separationProgress * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-accent-yellow">
            {Math.round(separationProgress * 100)}%
          </span>
        </div>
      )}

      {stemsReady && !isSeparating && (
        <div className="flex items-center gap-1">
          <div className="status-dot active" />
          <span className="font-mono text-[10px] text-accent-green uppercase">STEMS READY</span>
        </div>
      )}

      {/* FPS */}
      <div className="flex items-center gap-2 border-l-3 border-brutal-border pl-4">
        <span className="font-mono text-[10px] text-brutal-muted">FPS</span>
        <span className={`font-mono text-sm font-bold ${fpsColor}`}>{metrics.fps}</span>
      </div>

      {/* Frame time */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[10px] text-brutal-muted">FT</span>
        <span className="font-mono text-[10px] text-brutal-text">{metrics.avgFrameTime.toFixed(1)}ms</span>
      </div>

      {/* Memory */}
      {metrics.memoryUsage > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-brutal-muted">MEM</span>
          <span className="font-mono text-[10px] text-brutal-text">{metrics.memoryUsage}MB</span>
        </div>
      )}

      {/* Clock */}
      <div className="font-mono text-[10px] text-brutal-muted border-l-3 border-brutal-border pl-4">
        {new Date().toLocaleTimeString('en-US', { hour12: false })}
      </div>
    </div>
  );
};
