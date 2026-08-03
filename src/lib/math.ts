export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Wraps any value into the [0, 1) range (handles negatives). */
export const wrap01 = (v: number): number => ((v % 1) + 1) % 1;

/** Hermite smoothstep between edges. */
export const smoothstep = (edge0: number, edge1: number, v: number): number => {
  const t = clamp((v - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const atan2Deg = (y: number, x: number): number =>
  (Math.atan2(y, x) * 180) / Math.PI;

/** Shortest wrapped distance between two values in [0,1) space. */
export const wrappedDistance = (a: number, b: number): number => {
  const d = Math.abs(wrap01(a) - wrap01(b));
  return Math.min(d, 1 - d);
};
