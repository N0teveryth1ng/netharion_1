"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type SoundKind = "hover" | "click" | "portal" | "success" | "chime";

type SoundCtx = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  play: (kind: SoundKind) => void;
  volume: number;
  setVolume: (v: number) => void;
};

const Ctx = createContext<SoundCtx | null>(null);

function makeNoise(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.08,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("netharion-sound") === "1";
    } catch {
      return false;
    }
  });
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    try {
      return parseFloat(localStorage.getItem("netharion-volume") || "0.5");
    } catch {
      return 0.5;
    }
  });

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    if (typeof window !== "undefined") localStorage.setItem("netharion-sound", v ? "1" : "0");
    if (v && !ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    if (typeof window !== "undefined") localStorage.setItem("netharion-volume", v.toString());
  }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      if (!enabled) return;
      const ctx = ctxRef.current ?? new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = volume * 0.8; // Increased base volume with volume control
      master.connect(ctx.destination);

      if (kind === "hover") {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(440, t);
        o.frequency.exponentialRampToValueAtTime(520, t + 0.05);
        g.gain.setValueAtTime(0.15, t); // Increased from 0.04
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 0.09);
        return;
      }
      if (kind === "click") {
        makeNoise(ctx, 180, 0.06, "triangle", 0.2); // Increased from 0.06
        return;
      }
      if (kind === "portal") {
        for (let i = 0; i < 3; i++) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          const f0 = 110 + i * 55;
          o.frequency.setValueAtTime(f0, t + i * 0.07);
          o.frequency.exponentialRampToValueAtTime(f0 * 4, t + i * 0.07 + 0.35);
          g.gain.setValueAtTime(0.15, t + i * 0.07); // Increased from 0.05
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.45);
          o.connect(g);
          g.connect(master);
          o.start(t + i * 0.07);
          o.stop(t + i * 0.07 + 0.5);
        }
        return;
      }
      if (kind === "success") {
        [523.25, 659.25, 783.99].forEach((hz, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "triangle";
          o.frequency.value = hz;
          g.gain.setValueAtTime(0.2, t + i * 0.06); // Increased from 0.06
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
          o.connect(g);
          g.connect(master);
          o.start(t + i * 0.06);
          o.stop(t + i * 0.06 + 0.3);
        });
        return;
      }
      if (kind === "chime") {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(1320, t + 0.4);
        g.gain.setValueAtTime(0.15, t); // Increased from 0.05
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 0.6);
      }
    },
    [enabled, volume],
  );

  const value = useMemo(() => ({ enabled, setEnabled, play, volume, setVolume }), [enabled, setEnabled, play, volume, setVolume]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNetharionSound() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNetharionSound requires SoundProvider");
  return v;
}
