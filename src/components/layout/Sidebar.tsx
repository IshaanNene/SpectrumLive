// ================================================================
// Sidebar Navigation — DAW-inspired vertical nav with brutal styling
// ================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '../../stores/audioStore';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  shortLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'DASHBOARD',     icon: '◫', shortLabel: 'DASH' },
  { id: 'import',     label: 'AUDIO IMPORT',   icon: '⎆', shortLabel: 'IMPORT' },
  { id: 'stems',      label: 'STEM MIXER',     icon: '⌸', shortLabel: 'STEMS' },
  { id: 'lighting',   label: 'LIGHT MAPPER',   icon: '◎', shortLabel: 'LIGHTS' },
  { id: 'stage',      label: 'LIVE STAGE',     icon: '▣', shortLabel: 'STAGE' },
  { id: 'metrics',    label: 'METRICS',        icon: '⊞', shortLabel: 'PERF' },
];

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const bpm = useAudioStore((s) => s.bpm);

  return (
    <div className="w-16 lg:w-52 h-full bg-brutal-surface border-r-3 border-brutal-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-3 lg:p-4 border-b-3 border-brutal-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-3 border-accent-cyan bg-brutal-bg flex items-center justify-center">
            <span className="text-accent-cyan text-lg font-bold">S</span>
          </div>
          <div className="hidden lg:block">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan">
              Synesthetic
            </div>
            <div className="font-display text-sm font-bold tracking-wider text-brutal-text -mt-1">
              STAGE
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = activePage === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 lg:px-4 py-3 font-mono text-xs uppercase tracking-wider
                border-l-3 transition-all duration-100 relative group
                ${isActive
                  ? 'bg-brutal-bg border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-brutal-muted hover:text-brutal-text hover:bg-brutal-bg/50'
                }
              `}
              whileHover={{ x: 2 }}
              whileTap={{ x: 0 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent-cyan"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="p-3 lg:p-4 border-t-3 border-brutal-border space-y-2">
        {/* Playback indicator */}
        <div className="flex items-center gap-2">
          <div className={`status-dot ${isPlaying ? 'active' : 'idle'}`} />
          <span className="hidden lg:inline font-mono text-[10px] uppercase text-brutal-muted">
            {isPlaying ? 'PLAYING' : 'IDLE'}
          </span>
        </div>

        {/* BPM */}
        {bpm > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-brutal-muted">BPM</span>
            <span className="font-mono text-sm text-accent-red font-bold">{bpm}</span>
          </div>
        )}

        {/* Version */}
        <div className="hidden lg:block font-mono text-[9px] text-brutal-muted/50">
          v1.0.0 // STROBE LIVE
        </div>
      </div>
    </div>
  );
};
