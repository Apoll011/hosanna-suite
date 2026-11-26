// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useRef } from "react";

export interface CursorSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  trailX: number;
  trailY: number;
  energy: number;
}

export function useCursor() {
  // Initial resting coordinate matching the reference hero initial frame
  const targetRef = useRef({ x: 0.5, y: 0.465 });
  const currentRef = useRef({ x: 0.5, y: 0.465 });
  const trailRef = useRef({ x: 0.5, y: 0.465 });
  const velocityRef = useRef({ vx: 0, vy: 0, speed: 0, energy: 0 });
  const snapshotRef = useRef<CursorSnapshot>({
    x: 0.5,
    y: 0.465,
    vx: 0,
    vy: 0,
    speed: 0,
    trailX: 0.5,
    trailY: 0.465,
    energy: 0,
  });

  useEffect(() => {
    const updateFromClient = (clientX: number, clientY: number) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      targetRef.current.x = Math.min(1, Math.max(0, clientX / width));
      targetRef.current.y = Math.min(1, Math.max(0, 1.0 - clientY / height));
    };

    const handlePointerMove = (e: PointerEvent) => {
      updateFromClient(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateFromClient(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateFromClient(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  const setTargetUV = useCallback((x: number, y: number) => {
    targetRef.current.x = Math.min(1, Math.max(0, x));
    targetRef.current.y = Math.min(1, Math.max(0, y));
  }, []);

  const stepLerp = useCallback((factor = 0.14, deltaSeconds = 1 / 60): CursorSnapshot => {
    // Frame-rate normalized smoothing anchored to 60fps
    const clampedDt = Math.min(Math.max(deltaSeconds, 0.001), 0.05);
    const dtScale = clampedDt * 60.0;
    const alpha = 1.0 - Math.pow(1.0 - factor, dtScale);
    const trailAlpha = 1.0 - Math.pow(1.0 - 0.048, dtScale);
    const velAlpha = 1.0 - Math.pow(1.0 - 0.14, dtScale);

    const prevX = currentRef.current.x;
    const prevY = currentRef.current.y;

    const nextX = prevX + (targetRef.current.x - prevX) * alpha;
    const nextY = prevY + (targetRef.current.y - prevY) * alpha;

    currentRef.current.x = nextX;
    currentRef.current.y = nextY;

    trailRef.current.x += (nextX - trailRef.current.x) * trailAlpha;
    trailRef.current.y += (nextY - trailRef.current.y) * trailAlpha;

    const rawVx = (nextX - prevX) / Math.max(dtScale, 0.001);
    const rawVy = (nextY - prevY) / Math.max(dtScale, 0.001);

    // Smooth medium-viscosity velocity response
    velocityRef.current.vx += (rawVx - velocityRef.current.vx) * velAlpha;
    velocityRef.current.vy += (rawVy - velocityRef.current.vy) * velAlpha;
    const speed = Math.hypot(velocityRef.current.vx, velocityRef.current.vy);
    velocityRef.current.speed = speed;

    // Responsive fluid excitation with silky relaxation
    const targetEnergy = Math.min(1.2, speed * 24.0);
    const energyRate = targetEnergy > velocityRef.current.energy ? 0.095 : 0.028;
    const energyAlpha = 1.0 - Math.pow(1.0 - energyRate, dtScale);
    velocityRef.current.energy += (targetEnergy - velocityRef.current.energy) * energyAlpha;

    snapshotRef.current.x = nextX;
    snapshotRef.current.y = nextY;
    snapshotRef.current.vx = velocityRef.current.vx;
    snapshotRef.current.vy = velocityRef.current.vy;
    snapshotRef.current.speed = speed;
    snapshotRef.current.trailX = trailRef.current.x;
    snapshotRef.current.trailY = trailRef.current.y;
    snapshotRef.current.energy = velocityRef.current.energy;

    return snapshotRef.current;
  }, []);

  return {
    stepLerp,
    setTargetUV,
    currentRef,
    targetRef,
  };
}
