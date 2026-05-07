# SpectrumLive

**Real-time audio-reactive lighting engine for live concert visuals.**

Drop in any audio track — SpectrumLive separates it into 7 instrument stems, analyses each in real time, and drives a 3D stage full of spotlights, lasers, LED bars, and strobes that react directly to the music.

---

## Features

- **7-Stem Frequency Isolation** — Non-overlapping bandpass filters carve the audio into Drums, Bass, Vocals, Guitar, Synth, Piano, and Other (cymbals/hi-hats), each with independent loudness, peak, and onset detection.
- **Direct Audio → Light Mapping** — Instrument loudness directly controls fixture intensity. Drums hit → drum lights flash. Bass drops → bass lights surge. No idle glow.
- **3D Stage Visualizer** — React Three Fiber scene with volumetric light cones, trusses, fog particles, laser beams, bloom, vignette, and ACES filmic tone mapping.
- **8 Animation Styles** — Strobe, Pulse, Fade, Sweep, Chase, Random, Breath, Wave — each shapes the audio signal without reducing it.
- **BPM Detection** — Energy autocorrelation on the raw waveform detects tempo (60–200 BPM) and syncs animations to the beat.
- **Full Lighting Control** — Create/edit fixtures (Spot, Wash, Beam, Strobe, Laser, LED Bar, PAR), assign stems, pick triggers (loudness/peak/onset/spectral/rhythm), tune sensitivity.
- **Live HUD** — Overlay with real-time stem activity bars, BPM readout, bloom/fog/haze/laser controls.
- **Stem Mixer** — Per-stem volume, mute, solo, and pan controls.
- **Performance Metrics** — Frame rate, analysis latency, and engine health monitoring.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| 3D | Three.js, React Three Fiber, Drei, Post-processing |
| Audio | Web Audio API, Tone.js |
| State | Zustand |
| Animations | Framer Motion |
| Styling | Tailwind CSS 3 |
| Desktop (optional) | Electron 28 |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (ships with Node 18+)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/IshaanNene/SpectrumLive.git
cd SpectrumLive
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## Usage

1. **Import Audio** — Navigate to the **Import** page and drop any audio file (MP3, WAV, FLAC, OGG, etc.).
2. **View Stems** — Switch to **Stems** to see the 7-band frequency separation in real time.
3. **Map Lights** — On the **Lighting** page, create fixtures and map them to stems with your preferred trigger and animation style.
4. **Go Live** — Open the **Stage** page for the fullscreen 3D visualizer. Hit play and watch the lights react.
5. **Tune** — Use the HUD overlay to adjust bloom, fog density, haze, and lasers on the fly.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Type-check with `tsc` and produce a production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run electron:dev` | Launch as an Electron desktop app (dev mode) |
| `npm run electron:build` | Package as a distributable Electron app |

---

## Project Structure

```
SpectrumLive/
├── index.html                  # Entry HTML
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json
└── src/
    ├── main.tsx                # React entry point
    ├── App.tsx                 # App shell (sidebar, topbar, transport, routing)
    ├── index.css               # Global styles & design tokens
    ├── engine/
    │   ├── AudioEngine.ts      # Web Audio API: playback, FFT, stem analysis, BPM
    │   └── LightingEngine.ts   # Audio → light mapping, signal shaping, fixture computation
    ├── components/
    │   ├── audio/
    │   │   ├── SpectrumAnalyzer.tsx   # Master FFT bar visualizer
    │   │   └── StemMeter.tsx          # Per-stem loudness meter
    │   └── layout/
    │       ├── Sidebar.tsx     # Navigation sidebar
    │       ├── TopBar.tsx      # Header bar
    │       └── TransportBar.tsx# Playback transport controls
    ├── pages/
    │   ├── Dashboard.tsx       # Overview: 3D preview, audio status, stem levels
    │   ├── AudioImport.tsx     # File import & stem separation
    │   ├── StemMixer.tsx       # Per-stem volume/mute/solo/pan
    │   ├── LightingMapper.tsx  # Fixture setup & stem-to-light mapping
    │   ├── LiveStage.tsx       # Fullscreen 3D stage with HUD overlay
    │   └── Metrics.tsx         # Performance monitoring
    ├── stores/
    │   ├── audioStore.ts       # Zustand store for audio state
    │   └── lightingStore.ts    # Zustand store for fixtures, mappings, stage config
    ├── hooks/
    │   ├── useAudioEngine.ts   # Audio engine lifecycle hook
    │   ├── useLightingEngine.ts# Lighting engine lifecycle hook
    │   └── usePerformanceMetrics.ts # FPS & latency tracking
    ├── three/
    │   └── StageVisualizer.tsx # R3F scene: fixtures, trusses, fog, lasers, post-processing
    └── types/
        ├── audio.ts            # StemType, StemAnalysis, AudioState, etc.
        ├── lighting.ts         # Fixture, LightMapping, StageConfig, etc.
        └── index.ts            # Re-exports
```

---

## License

[BSD 2-Clause](LICENSE) © 2026 Ishaan Nene
