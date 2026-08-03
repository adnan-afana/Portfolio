import { atan2Deg, clamp, lerp, smoothstep, wrap01 } from "./math";
import type { AnimationConfig } from "./animation";

/**
 * The ribbon path — a closed loop sampled with Catmull-Rom interpolation.
 *
 * x, y are normalized viewport fractions (0..1 is on screen, values outside
 * bleed past the edges). z is depth in [-1, 1]: +1 is the closest point to
 * the viewer (the "active" position), -1 is the farthest (behind portrait).
 *
 * The loop is deliberately asymmetric: cards start BELOW the viewport at the
 * lower-left, rise into a pronounced foreground bulge just left of center,
 * then climb and recede toward an upper-right exit before wrapping far
 * behind the portrait and returning down the left edge.
 *
 * TUNING THE CURVE: move these control points.
 */
export type PathPoint = { x: number; y: number; z: number };

export const RIBBON_PATH: PathPoint[] = [
  { x: -0.1, y: 1.06, z: 0.3 }, // below the viewport, lower-left
  { x: 0.14, y: 0.92, z: 0.62 }, // rising through the lower-left corner
  { x: 0.4, y: 0.7, z: 1.0 }, // ← front bulge / active position (ACTIVE_T)
  { x: 0.66, y: 0.46, z: 0.55 }, // climbing right, starting to recede
  { x: 0.88, y: 0.26, z: 0.1 }, // upper-right, small
  { x: 1.1, y: 0.1, z: -0.35 }, // exits past the top-right corner
  { x: 0.72, y: 0.1, z: -0.85 }, // far sweep along the top
  { x: 0.32, y: 0.16, z: -1.0 }, // farthest point, behind the head
  { x: -0.04, y: 0.3, z: -0.75 }, // behind, left of the portrait
  { x: -0.18, y: 0.62, z: -0.35 }, // off the left edge, descending
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

/**
 * Non-linear card spacing. Uniform slot positions are warped so the loop
 * STRETCHES around the front position (the active card gets breathing room)
 * and COMPRESSES on the far side (distant cards bunch up and overlap).
 * ACTIVE_T is a fixed point of the warp, so active-project timing is
 * unaffected. Keep amount < 0.159 to stay monotonic.
 */
export function warpSpacing(u: number, amount: number): number {
  return wrap01(u + amount * Math.sin(2 * Math.PI * (u - ACTIVE_T)));
}

export type CardTransform = {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  opacity: number;
  /** 0..~0.6 — strength of the darkening overlay on distant cards. */
  dim: number;
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
 * styling from z, rotation from the path tangent — flattened out as the
 * card approaches the front so the active card reads nearly straight-on.
 */
export function getCardTransform(
  slot: number,
  total: number,
  progress: number,
  cfg: AnimationConfig,
  vp: Viewport
): CardTransform {
  const uniform = wrap01(cfg.baseOffset + slot / total + progress * cfg.travel);
  const t = warpSpacing(uniform, cfg.spacingWarp);
  const pt = sampleRibbon(t);

  const eps = 0.008;
  const ahead = sampleRibbon(t + eps);
  const behind = sampleRibbon(t - eps);
  const dx = (ahead.x - behind.x) * vp.w;
  const dy = (ahead.y - behind.y) * vp.h;
  const dz = (ahead.z - behind.z) * cfg.depthPx;

  const zn = (pt.z + 1) / 2;
  const depth = Math.pow(zn, cfg.depthPower);

  // Rotation follows the path tangent, but fades out near the front so the
  // active card faces the viewer almost squarely.
  const frontFlatten = lerp(1, 0.12, smoothstep(0.55, 0.95, zn));
  const rotateZ =
    clamp(atan2Deg(dy, dx) * cfg.tiltFactor, -cfg.maxTilt, cfg.maxTilt) *
    frontFlatten;
  const rotateY =
    clamp(
      -atan2Deg(dz, Math.hypot(dx, dy)) * cfg.turnFactor,
      -cfg.maxTurn,
      cfg.maxTurn
    ) * frontFlatten;
  const rotateX = lerp(cfg.rotXBack, cfg.rotXFront, zn) * frontFlatten;

  return {
    x: pt.x * vp.w,
    y: pt.y * vp.h,
    rotateX,
    rotateY,
    rotateZ,
    scale: lerp(cfg.minScale, cfg.maxScale, depth),
    opacity: clamp(lerp(cfg.minOpacity, 1, Math.pow(zn, 0.9)), 0, 1),
    dim: (1 - depth) * cfg.dimStrength,
    zIndex: Math.round(lerp(8, 96, zn)),
    zn,
    t,
  };
}
