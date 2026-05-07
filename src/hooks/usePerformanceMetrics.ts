// ================================================================
// usePerformanceMetrics — Tracks FPS, frame time, and latency
// ================================================================

import { useState, useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;    // ms
  avgFrameTime: number; // ms (rolling average)
  minFps: number;
  maxFps: number;
  gpuTime: number;      // Estimated GPU time
  memoryUsage: number;  // MB (if available)
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    avgFrameTime: 16.67,
    minFps: 60,
    maxFps: 60,
    gpuTime: 0,
    memoryUsage: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef(performance.now());
  const minFpsRef = useRef(Infinity);
  const maxFpsRef = useRef(0);

  useEffect(() => {
    let raf: number;

    const measure = () => {
      const now = performance.now();
      const frameTime = now - lastFrameRef.current;
      lastFrameRef.current = now;

      frameTimesRef.current.push(frameTime);
      if (frameTimesRef.current.length > 120) frameTimesRef.current.shift();

      const fps = Math.round(1000 / frameTime);
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const avgFps = Math.round(1000 / avgFrameTime);

      if (fps > 0 && fps < 1000) {
        minFpsRef.current = Math.min(minFpsRef.current, fps);
        maxFpsRef.current = Math.max(maxFpsRef.current, fps);
      }

      // Memory usage (Chrome only)
      const memory = (performance as any).memory;
      const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;

      // Update every 10 frames for performance
      if (frameTimesRef.current.length % 10 === 0) {
        setMetrics({
          fps: avgFps,
          frameTime: Math.round(frameTime * 100) / 100,
          avgFrameTime: Math.round(avgFrameTime * 100) / 100,
          minFps: minFpsRef.current === Infinity ? 0 : minFpsRef.current,
          maxFps: maxFpsRef.current,
          gpuTime: Math.round(frameTime * 0.6 * 100) / 100, // Rough estimate
          memoryUsage,
        });
      }

      raf = requestAnimationFrame(measure);
    };

    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  return metrics;
}
