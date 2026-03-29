"use client";

import { useState, useEffect } from "react";
import { useNetharionSound } from "@/components/SoundProvider";

export function SoundToggle() {
  const { enabled, setEnabled, volume, setVolume } = useNetharionSound();
  const [showVolume, setShowVolume] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="relative">
        <button
          type="button"
          className="rounded-full border border-[var(--n-border)] bg-[var(--n-surface)] px-3 py-1.5 text-xs text-[var(--n-muted)] transition hover:border-[var(--n-gold-dim)] hover:text-[var(--n-gold)]"
          title="Enable realm audio"
        >
          🔇
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowVolume(!showVolume)}
        className="rounded-full border border-[var(--n-border)] bg-[var(--n-surface)] px-3 py-1.5 text-xs text-[var(--n-muted)] transition hover:border-[var(--n-gold-dim)] hover:text-[var(--n-gold)]"
        title={enabled ? "Sound controls" : "Enable realm audio"}
      >
        {enabled ? "🔊" : "🔇"} {enabled && `${Math.round(volume * 100)}%`}
      </button>

      {showVolume && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="space-y-3">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--n-text)]">Sound</span>
              <button
                type="button"
                onClick={() => {
                  setEnabled(!enabled);
                  if (!enabled) setShowVolume(false);
                }}
                className="px-3 py-1 text-xs bg-[var(--n-accent)] text-white rounded hover:bg-opacity-80"
              >
                {enabled ? "Disable" : "Enable"}
              </button>
            </div>

            {/* Volume Slider */}
            {enabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--n-text)]">Volume</span>
                  <span className="text-xs text-[var(--n-muted)]">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--n-accent) 0%, var(--n-accent) ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                  }}
                />
              </div>
            )}

            {/* Quick Volume Presets */}
            {enabled && (
              <div className="space-y-1">
                <span className="text-sm text-[var(--n-text)]">Quick Set</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVolume(v)}
                      className={`px-2 py-1 text-xs rounded ${
                        volume === v
                          ? 'bg-[var(--n-accent)] text-white'
                          : 'bg-gray-700 text-[var(--n-muted)] hover:bg-gray-600'
                      }`}
                    >
                      {v === 0 ? '🔇' : `${Math.round(v * 100)}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
