import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neo-brutalist dark industrial palette
        brutal: {
          bg: '#0a0a0a',
          surface: '#141414',
          panel: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e8e8e8',
          muted: '#666666',
        },
        accent: {
          red: '#ff3333',
          cyan: '#00ffcc',
          yellow: '#ffcc00',
          magenta: '#ff00aa',
          blue: '#3366ff',
          green: '#33ff66',
          orange: '#ff6633',
          purple: '#aa33ff',
        },
        // Instrument-specific colors
        stem: {
          drums: '#ff3333',
          bass: '#3366ff',
          vocals: '#ffcc00',
          guitar: '#ff6633',
          synth: '#aa33ff',
          piano: '#00ffcc',
          other: '#666666',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px rgba(255,255,255,0.1)',
        'brutal-accent': '4px 4px 0px 0px #ff3333',
        'brutal-cyan': '4px 4px 0px 0px #00ffcc',
        'brutal-lg': '8px 8px 0px 0px rgba(255,255,255,0.1)',
        'brutal-inset': 'inset 2px 2px 0px 0px rgba(255,255,255,0.05)',
        glow: '0 0 20px rgba(0, 255, 204, 0.3)',
        'glow-red': '0 0 20px rgba(255, 51, 51, 0.3)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 204, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 204, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
