/**
 * Animation tuning — every knob for the scroll experience lives here.
 *
 * pages       — virtual scroll length in viewport-heights (7 → 700vh)
 * travel      — how far around the loop the cards travel over the full
 *               scroll (1 = exactly one revolution, every card passes front)
 * baseOffset  — rotates the initial arrangement so the first card reaches
 *               the front position just after the entry phase
 * depthPx     — how much 1 unit of z is "worth" when deriving rotation
 * entryEnd    — portion of the timeline used by the rise-from-below intro
 * exitStart   — where the final drift-up-and-away begins
 */

export type AnimationConfig = {
  pages: number;
  travel: number;
  baseOffset: number;
  depthPx: number;
  minScale: number;
  maxScale: number;
  minOpacity: number;
  tiltFactor: number;
  maxTilt: number;
  turnFactor: number;
  maxTurn: number;
  rotXBack: number;
  rotXFront: number;
  entryEnd: number;
  exitStart: number;
  /** Depth threshold below which a card renders behind the portrait. */
  backThreshold: number;
  showOrbitLines: boolean;
};

export const DESKTOP_CONFIG: AnimationConfig = {
  pages: 7,
  travel: 1,
  baseOffset: 0.11,
  depthPx: 1100,
  minScale: 0.42,
  maxScale: 1,
  minOpacity: 0.26,
  tiltFactor: 0.32,
  maxTilt: 10,
  turnFactor: 0.5,
  maxTurn: 32,
  rotXBack: 6,
  rotXFront: 1.5,
  entryEnd: 0.08,
  exitStart: 0.94,
  backThreshold: 0.42,
  showOrbitLines: true,
};

export const TABLET_CONFIG: AnimationConfig = {
  ...DESKTOP_CONFIG,
  pages: 6,
  depthPx: 800,
  maxTurn: 22,
  minScale: 0.46,
};

export const MOBILE_CONFIG: AnimationConfig = {
  ...DESKTOP_CONFIG,
  pages: 5,
  depthPx: 500,
  turnFactor: 0.35,
  maxTurn: 16,
  maxTilt: 7,
  minScale: 0.5,
  minOpacity: 0.2,
  showOrbitLines: false,
};

export const BREAKPOINTS = {
  desktop: "(min-width: 1200px)",
  tablet: "(min-width: 768px) and (max-width: 1199px)",
  mobile: "(max-width: 767px)",
} as const;

/** z-index of the portrait layer; cards sort themselves around it. */
export const PORTRAIT_Z_INDEX = 50;
