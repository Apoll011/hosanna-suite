export type SpringState = {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
};

export function createSpring(x: number, k = 400, c = 30): SpringState {
  return { x, v: 0, t: x, k, c };
}

export function tuneSpring(s: SpringState, k: number, c: number, reducedMotion = false): void {
  s.k = k;
  s.c = reducedMotion ? 2 * Math.sqrt(k) : c;
}

export function stepSpring(s: SpringState, dt: number): void {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
