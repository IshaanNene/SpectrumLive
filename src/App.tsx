// ================================================================
// App.tsx — Main application shell with sidebar, topbar, transport
// ================================================================

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { TransportBar } from './components/layout/TransportBar';
import { useLightingEngine } from './hooks/useLightingEngine';
import { useAudioEngine } from './hooks/useAudioEngine';

// Pages
import { Dashboard } from './pages/Dashboard';
import { AudioImport } from './pages/AudioImport';
import { StemMixer } from './pages/StemMixer';
import { LightingMapper } from './pages/LightingMapper';
import { LiveStage } from './pages/LiveStage';
import { Metrics } from './pages/Metrics';

const pages: Record<string, React.FC> = {
  dashboard: Dashboard,
  import: AudioImport,
  stems: StemMixer,
  lighting: LightingMapper,
  stage: LiveStage,
  metrics: Metrics,
};

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  // Initialize engines
  useAudioEngine();
  useLightingEngine();

  const PageComponent = pages[activePage] || Dashboard;

  return (
    <div className="w-full h-full flex flex-col bg-brutal-bg noise-overlay">
      {/* Top bar */}
      <TopBar activePage={activePage} />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <Sidebar activePage={activePage} onPageChange={setActivePage} />

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              className="h-full"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Transport bar — always visible */}
      <TransportBar />
    </div>
  );
};

export default App;
