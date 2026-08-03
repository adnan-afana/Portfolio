"use client";

import { RefObject, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AnimationConfig,
  BREAKPOINTS,
  DESKTOP_CONFIG,
  MOBILE_CONFIG,
  TABLET_CONFIG,
} from "@/lib/animation";
import { ACTIVE_T, getCardTransform, Viewport } from "@/lib/curve";
import { smoothstep, wrap01, wrappedDistance } from "@/lib/math";

type AnimationRefs = {
  heroRef: RefObject<HTMLElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;
  /** Indexed by track slot. */
  cardRefs: RefObject<(HTMLElement | null)[]>;
  orbitPathRefs: RefObject<(SVGPathElement | null)[]>;
  orbitRef: RefObject<SVGSVGElement | null>;
  nameARef: RefObject<HTMLDivElement | null>;
  nameBRef: RefObject<HTMLDivElement | null>;
  indicatorRef: RefObject<HTMLDivElement | null>;
};

type AnimationOptions = AnimationRefs & {
  totalCards: number;
  enabled: boolean;
  /** Fires (throttled to real changes) when the front-most slot changes. */
  onActiveSlotChange: (slot: number) => void;
};

/**
 * The master scroll animation. One ScrollTrigger pins the hero and scrubs
 * a 0..1 progress value; every layer is derived from that value in a single
 * render function that writes DOM transforms directly (no React state on
 * the hot path).
 */
export function usePortfolioAnimation(options: AnimationOptions): void {
  const {
    heroRef,
    trackRef,
    cardRefs,
    orbitPathRefs,
    orbitRef,
    nameARef,
    nameBRef,
    indicatorRef,
    totalCards,
    enabled,
    onActiveSlotChange,
  } = options;

  const onActiveRef = useRef(onActiveSlotChange);
  onActiveRef.current = onActiveSlotChange;

  useLayoutEffect(() => {
    if (!enabled) return;
    const hero = heroRef.current;
    if (!hero) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      const build = (cfg: AnimationConfig) => {
        const vp: Viewport = { w: window.innerWidth, h: window.innerHeight };
        let activeSlot = -1;
        let lastProgress = 0;

        const render = (p: number) => {
          lastProgress = p;

          const entry = smoothstep(0, cfg.entryEnd, p);
          const exit = smoothstep(cfg.exitStart, 1, p);
          const entryLift = (1 - entry) * vp.h * 0.55;
          const exitLift = exit * vp.h * 0.32;
          const exitShift = exit * vp.w * 0.08;
          const opacityMul = (0.1 + 0.9 * entry) * (1 - 0.45 * exit);

          let bestSlot = -1;
          let bestDist = Infinity;

          const cards = cardRefs.current ?? [];
          for (let slot = 0; slot < totalCards; slot++) {
            const el = cards[slot];
            if (!el) continue;
            const tr = getCardTransform(slot, totalCards, p, cfg, vp);

            el.style.transform =
              `translate3d(${(tr.x + exitShift).toFixed(2)}px, ${(
                tr.y +
                entryLift -
                exitLift
              ).toFixed(2)}px, 0) ` +
              `translate(-50%, -50%) perspective(1200px) ` +
              `rotateX(${tr.rotateX.toFixed(2)}deg) rotateY(${tr.rotateY.toFixed(
                2
              )}deg) rotateZ(${tr.rotateZ.toFixed(2)}deg) ` +
              `scale(${tr.scale.toFixed(4)})`;
            el.style.opacity = (tr.opacity * opacityMul).toFixed(3);
            el.style.zIndex = String(tr.zIndex);
            el.classList.toggle("is-back", tr.zn < cfg.backThreshold);

            const dist = wrappedDistance(tr.t, ACTIVE_T);
            if (dist < bestDist) {
              bestDist = dist;
              bestSlot = slot;
            }
          }

          // A slot only counts as "active" when it is genuinely near the front.
          const nextActive =
            bestDist < 0.42 / totalCards && entry >= 1 ? bestSlot : -1;
          if (nextActive !== activeSlot) {
            activeSlot = nextActive;
            cards.forEach((el, slot) =>
              el?.classList.toggle("is-active", slot === activeSlot)
            );
            if (activeSlot >= 0) onActiveRef.current(activeSlot);
          }

          // Background name typography drifts with scroll, apart at the end.
          if (nameARef.current) {
            nameARef.current.style.transform = `translate3d(${(
              wrap01Drift(p, -1) - exit * vp.w * 0.05
            ).toFixed(2)}px, 0, 0)`;
          }
          if (nameBRef.current) {
            nameBRef.current.style.transform = `translate3d(${(
              wrap01Drift(p, 1) + exit * vp.w * 0.05
            ).toFixed(2)}px, 0, 0)`;
          }

          // Orbit guide lines draw in over the first fifth of the timeline.
          const draw = smoothstep(0.02, 0.2, p);
          (orbitPathRefs.current ?? []).forEach((path, i) => {
            if (!path) return;
            path.style.strokeDashoffset = String(1 - draw * (1 - i * 0.06));
          });
          if (orbitRef.current) {
            orbitRef.current.style.opacity = (
              (0.4 + 0.6 * draw) *
              (1 - exit)
            ).toFixed(3);
          }

          if (indicatorRef.current) {
            indicatorRef.current.style.opacity = (
              1 - smoothstep(0.01, 0.05, p)
            ).toFixed(3);
          }
        };

        const wrap01Drift = (p: number, dir: number) =>
          dir * (p - 0.5) * vp.w * 0.055;

        const st = ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: () => `+=${window.innerHeight * cfg.pages}`,
          pin: true,
          scrub: 1.2,
          invalidateOnRefresh: true,
          onUpdate: (self) => render(self.progress),
          onRefresh: (self) => {
            vp.w = window.innerWidth;
            vp.h = window.innerHeight;
            render(self.progress);
          },
        });

        render(wrap01(lastProgress));

        return () => {
          st.kill();
        };
      };

      mm.add(BREAKPOINTS.desktop, () => build(DESKTOP_CONFIG));
      mm.add(BREAKPOINTS.tablet, () => build(TABLET_CONFIG));
      mm.add(BREAKPOINTS.mobile, () => build(MOBILE_CONFIG));
    }, hero);

    return () => ctx.revert();
  }, [
    enabled,
    totalCards,
    heroRef,
    trackRef,
    cardRefs,
    orbitPathRefs,
    orbitRef,
    nameARef,
    nameBRef,
    indicatorRef,
  ]);
}
