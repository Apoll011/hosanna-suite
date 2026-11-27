export type SpringValue = { x: number; v: number; t: number; k: number; c: number };

export const springPresets = {
  menu: [300, 23],
  surface: [260, 24],
  feedback: [400, 32],
  highlightLead: [620, 36],
  highlightTrail: [200, 20],
} as const;

export function createSpring(x: number, stiffness = 400, damping = 30): SpringValue {
  return { x, v: 0, t: x, k: stiffness, c: damping };
}

export function tuneSpring(
  value: SpringValue,
  stiffness: number,
  damping: number,
  reduced = prefersReducedMotion(),
) {
  value.k = stiffness;
  value.c = reduced ? 2 * Math.sqrt(stiffness) : damping;
}

export function stepSpring(value: SpringValue, deltaSeconds: number) {
  const acceleration = -value.k * (value.x - value.t) - value.c * value.v;
  value.v += acceleration * deltaSeconds;
  value.x += value.v * deltaSeconds;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
