'use client';

// UI primitives shared by the 50-0 (MMA) and 38-0 (soccer) games.

import { useCallback, useEffect, useRef, useState } from 'react';

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ---------- sound ----------
export function useSound(muteKey: string) {
  const ctxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem(muteKey) === '1');
  }, [muteKey]);

  const ctx = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = useCallback((freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04, slideTo?: number) => {
    if (muted) return;
    try {
      const c = ctx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch { /* audio unavailable */ }
  }, [muted]);

  return {
    muted,
    toggleMute: () => setMuted(m => { localStorage.setItem(muteKey, m ? '0' : '1'); return !m; }),
    tick: () => tone(1150, 0.035, 'square', 0.025),
    land: () => tone(440, 0.18, 'triangle', 0.06, 660),
    thud: () => tone(150, 0.14, 'sine', 0.09, 55),
    winBell: () => { tone(660, 0.5, 'triangle', 0.06); setTimeout(() => tone(880, 0.5, 'triangle', 0.06), 120); setTimeout(() => tone(1320, 0.8, 'triangle', 0.06), 260); },
    womp: () => tone(220, 0.5, 'sawtooth', 0.05, 80),
    rowTickW: () => tone(880, 0.025, 'square', 0.015),
    rowTickL: () => tone(220, 0.12, 'sawtooth', 0.04, 120),
  };
}

// ---------- count-up number ----------
export function CountUp({ target, className }: { target: number; className: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 700;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span className={className}>{val}</span>;
}

// ---------- confetti ----------
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.scale(dpr, dpr);
    const colors = ['#f4c95e', '#e7b43c', '#b98a24', '#eef1f7'];
    const parts = Array.from({ length: 160 }, () => ({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 2 + Math.random() * 3.5,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let raf = 0;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      c.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx; p.rot += p.vr;
        if (p.y > innerHeight + 30) { p.y = -20; p.x = Math.random() * innerWidth; }
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);
  return <canvas id="confetti" ref={ref} />;
}
