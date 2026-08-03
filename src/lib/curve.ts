import { atan2Deg, clamp, lerp, wrap01 } from "./math";
import type { AnimationConfig } from "./animation";

/**
 * The ribbon path — a closed loop sampled with Catmull-Rom interpolation.
 *
 * x, y are normalized viewport fractions (0..1 is on screen, values outside
 * bleed past the edges). z is depth in [-1, 1]: +1 is the closest point to
 * the viewer (the "active" position), -1 is the farthest (behind portrait).
 *
 * TUNING THE CURVE: move these control points. The loop reads in order:
 * enter lower-left → foreground center (active) → recede upper-right →
 * wrap far behind the portrait → come back down the left edge.
 */
export type PathPoint = { x: number; y: number; z: number };

export const RIBBON_PATH: PathPoint[] = [
  { x: -0.08, y: 0.87, z: 0.35 },
  { x: 0.2, y: 0.82, z: 0.75 },
  { x: 0.46, y: 0.72, z: 1.0 }, // ← the front / active position (ACTIVE_T)
  { x: 0.72, y: 0.55, z: 0.72 },
  { x: 0.95, y: 0.38, z: 0.28 },
  { x: 1.08, y: 0.25, z: -0.35 },
  { x: 0.7, y: 0.19, z: -0.85 },
  { x: 0.3, y: 0.23, z: -1.0 },
  { x: -0.03, y: 0.37, z: -0.6 },
  { x: -0.17, y: 0.62, z: -0.1 },
];

/** Normalized loop position of the front control point (index 2 of 10). */
export const ACTIVE_T = 2 / RIBBON_PATH.length;

const catmullRom = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
};

/** Samples the closed ribbon loop at t ∈ [0, 1). */
export function sampleRibbon(t: number): PathPoint {
  const n = RIBBON_PATH.length;
  const scaled = wrap01(t) * n;
  const i = Math.floor(scaled);
  const u = scaled - i;
  const p0 = RIBBON_PATH[(i - 1 + n) % n];
  const p1 = RIBBON_PATH[i % n];
  const p2 = RIBBON_PATH[(i + 1) % n];
  const p3 = RIBBON_PATH[(i + 2) % n];
  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, u),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, u),
    z: catmullRom(p0.z, p1.z, p2.z, p3.z, u),
  };
}

export type CardTransform = {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  opacity: number;
  zIndex: number;
  /** Normalized depth 0 (back) .. 1 (front). */
  zn: number;
  /** The card's current position on the loop. */
  t: number;
};

export type Viewport = { w: number; h: number };

/**
 * Computes the full transform for one card slot at a given scroll progress.
 * Everything derives from the loop sample: position from (x, y), depth
 * styling from z, rotation from the path tangent.
 */
export function getCardTransform(
  slot: number,
  total: number,
  progress: number,
  cfg: AnimationConfig,
  vp: Viewport
): CardTransform {
  const t = wrap01(cfg.baseOffset + slot / total + progress * cfg.travel);
  const pt = sampleRibbon(t);

  const eps = 0.008;
  const ahead = sampleRibbon(t + eps);
  const behind = sampleRibbon(t - eps);
  const dx = (ahead.x - behind.x) * vp.w;
  const dy = (ahead.y - behind.y) * vp.h;
  const dz = (ahead.z - behind.z) * cfg.depthPx;

  const zn = (pt.z + 1) / 2;

  const rotateZ = clamp(
    atan2Deg(dy, dx) * cfg.tiltFactor,
    -cfg.maxTilt,
    cfg.maxTilt
  );
  const rotateY = clamp(
    -atan2Deg(dz, Math.hypot(dx, dy)) * cfg.turnFactor,
    -cfg.maxTurn,
    cfg.maxTurn
  );
  const rotateX = lerp(cfg.rotXBack, cfg.rotXFront, zn);

  return {
    x: pt.x * vp.w,
    y: pt.y * vp.h,
    rotateX,
    rotateY,
    rotateZ,
    scale: lerp(cfg.minScale, cfg.maxScale, Math.pow(zn, 1.2)),
    opacity: clamp(lerp(cfg.minOpacity, 1, Math.pow(zn, 0.8)), 0, 1),
    zIndex: Math.round(lerp(10, 90, zn)),
    zn,
    t,
  };
}
