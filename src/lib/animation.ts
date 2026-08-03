/**
 * Animation tuning — every knob for the scroll experience lives here.
 *
 * pages        — virtual scroll length in viewport-heights (7 → 700vh)
 * travel       — how far around the loop the cards travel over the full
 *                scroll (1 = exactly one revolution, every card passes front)
 * baseOffset   — rotates the initial arrangement so the first card reaches
 *                the front position just after the entry phase
 * spacingWarp  — non-linear spacing strength: >0 gives the active card more
 *                room and bunches distant cards together (keep < 0.159)
 * depthPx      — how much 1 unit of z is "worth" when deriving rotation
 * depthPower   — exponent shaping the depth falloff (higher = the front
 *                card separates harder from everything else)
 * dimStrength  — max darkness of the overlay on the most distant cards
 * activeBoost  — extra scale applied to the card at the front position
 * entryEnd     — portion of the timeline used by the rise-from-below intro
 * exitStart    — where the final drift-up-and-away begins
 */

export type AnimationConfig = {
  pages: number;
  travel: number;
  baseOffset: number;
  spacingWarp: number;
  depthPx: number;
  depthPower: number;
  minScale: number;
  maxScale: number;
  minOpacity: number;
  dimStrength: number;
  activeBoost: number;
  tiltFactor: number;
  maxTilt: number;
  turnFactor: number;
  maxTurn: number;
  rotXBack: number;
  rotXFront: number;
  entryEnd: number;
  exitStart: number;
  /** Depth threshold below which a card renders as "back zone" (blur, less detail). */
  backThreshold: number;
  showOrbitLines: boolean;
};

export const DESKTOP_CONFIG: AnimationConfig = {
  pages: 7,
  travel: 1,
  baseOffset: 0.11,
  spacingWarp: 0.05,
  depthPx: 1300,
  depthPower: 1.35,
  minScale: 0.5,
  maxScale: 1,
  minOpacity: 0.18,
  dimStrength: 0.55,
  activeBoost: 0.08,
  tiltFactor: 0.32,
  maxTilt: 10,
  turnFactor: 0.55,
  maxTurn: 38,
  rotXBack: 7,
  rotXFront: 1,
  entryEnd: 0.12,
  exitStart: 0.9,
  backThreshold: 0.42,
  showOrbitLines: true,
};

export const TABLET_CONFIG: AnimationConfig = {
  ...DESKTOP_CONFIG,
  pages: 6,
  depthPx: 950,
  maxTurn: 26,
  minScale: 0.52,
  spacingWarp: 0.045,
};

export const MOBILE_CONFIG: AnimationConfig = {
  ...DESKTOP_CONFIG,
  pages: 5,
  depthPx: 600,
  turnFactor: 0.38,
  maxTurn: 18,
  maxTilt: 7,
  minScale: 0.54,
  minOpacity: 0.14,
  spacingWarp: 0.03,
  showOrbitLines: false,
};

export const BREAKPOINTS = {
  desktop: "(min-width: 1200px)",
  tablet: "(min-width: 768px) and (max-width: 1199px)",
  mobile: "(max-width: 767px)",
} as const;

/** z-index of the portrait layer; cards sort themselves around it. */
export const PORTRAIT_Z_INDEX = 50;
