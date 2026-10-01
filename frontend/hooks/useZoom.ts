"use client";

import { useState, useEffect, useCallback } from "react";

const ZOOM_KEY    = "cgpt_zoom";
const ZOOM_MIN    = 50;
const ZOOM_MAX    = 200;
const ZOOM_STEP   = 25;
const ZOOM_DEFAULT = 100;

const STEPS = [50, 75, 100, 125, 150, 175, 200];

export function useZoom() {
  const [zoom, setZoomState] = useState<number>(ZOOM_DEFAULT);

  // Load persisted zoom on mount
  useEffect(() => {
    const saved = localStorage.getItem(ZOOM_KEY);
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= ZOOM_MIN && val <= ZOOM_MAX) {
        setZoomState(val);
        applyZoom(val);
      }
    }
  }, []);

  const applyZoom = (value: number) => {
    const el = document.getElementById("main-content");
    if (el) (el.style as any).zoom = `${value}%`;
  };

  const setZoom = useCallback((value: number) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
    setZoomState(clamped);
    applyZoom(clamped);
    localStorage.setItem(ZOOM_KEY, String(clamped));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => {
      const next = STEPS.find((s) => s > prev) ?? ZOOM_MAX;
      const val  = Math.min(next, ZOOM_MAX);
      applyZoom(val);
      localStorage.setItem(ZOOM_KEY, String(val));
      return val;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => {
      const next = [...STEPS].reverse().find((s) => s < prev) ?? ZOOM_MIN;
      const val  = Math.max(next, ZOOM_MIN);
      applyZoom(val);
      localStorage.setItem(ZOOM_KEY, String(val));
      return val;
    });
  }, []);

  const resetZoom = useCallback(() => setZoom(ZOOM_DEFAULT), [setZoom]);

  return { zoom, zoomIn, zoomOut, resetZoom, setZoom };
}
