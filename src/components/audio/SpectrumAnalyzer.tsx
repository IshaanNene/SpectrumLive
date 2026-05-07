// ================================================================
// SpectrumAnalyzer — Real-time FFT spectrum bar visualization
// Canvas-based for 60fps performance.
// ================================================================

import React, { useRef, useEffect } from 'react';
import { useAudioStore } from '../../stores/audioStore';

interface SpectrumAnalyzerProps {
  width?: number;
  height?: number;
  barCount?: number;
  color?: string;
  className?: string;
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  width = 300,
  height = 100,
  barCount = 64,
  color = '#00ffcc',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const spectrum = useAudioStore.getState().masterSpectrum;

      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const gap = 1;

      for (let i = 0; i < barCount; i++) {
        // Average nearby bins for this bar
        const binStart = Math.floor((i / barCount) * spectrum.length);
        const binEnd = Math.floor(((i + 1) / barCount) * spectrum.length);
        let sum = 0;
        let count = 0;
        for (let b = binStart; b < binEnd && b < spectrum.length; b++) {
          sum += spectrum[b];
          count++;
        }
        const value = count > 0 ? sum / count : 0;

        const barHeight = value * height * 0.9;
        const x = i * barWidth + gap / 2;
        const y = height - barHeight;

        // Gradient from dim to bright
        const alpha = 0.3 + value * 0.7;

        // Parse color for gradient
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;

        // Draw bar
        ctx.fillRect(x, y, barWidth - gap, barHeight);

        // Peak line
        if (value > 0.7) {
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x, y - 2, barWidth - gap, 2);
        }
      }

      ctx.globalAlpha = 1;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`waveform-canvas ${className}`}
    />
  );
};
