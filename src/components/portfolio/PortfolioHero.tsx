"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "@/data/projects";
import { PORTRAIT_Z_INDEX } from "@/lib/animation";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePortfolioAnimation } from "@/hooks/usePortfolioAnimation";
import Navigation from "./Navigation";
import BackgroundTypography from "./BackgroundTypography";
import Portrait from "./Portrait";
import OrbitLines from "./OrbitLines";
import ProjectTrack, { slotForIndex } from "./ProjectTrack";
import ProjectCounter from "./ProjectCounter";
import ScrollIndicator from "./ScrollIndicator";
import Loader from "./Loader";
import StaticShowcase from "./StaticShowcase";
import styles from "./portfolio.module.css";

/** Critical assets gating the reveal: portrait + first screenshots. */
const CRITICAL_ASSETS = [
  "/images/portrait.png",
  PROJECTS[0].image,
  PROJECTS[1].image,
];

export default function PortfolioHero() {
  const reducedMotion = useReducedMotion();

  const heroRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const orbitRef = useRef<SVGSVGElement>(null);
  const orbitPathRefs = useRef<(SVGPathElement | null)[]>([]);
  const nameARef = useRef<HTMLDivElement>(null);
  const nameBRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);

  // Slot → project index lookup for active-card reporting.
  const indexForSlot = useMemo(() => {
    const map = new Map<number, number>();
    PROJECTS.forEach((_, i) => map.set(slotForIndex(i), i));
    return map;
  }, []);

  const onActiveSlotChange = useCallback(
    (slot: number) => {
      const idx = indexForSlot.get(slot);
      if (idx !== undefined) setActiveIndex(idx);
    },
    [indexForSlot]
  );

  // Preload critical assets, then reveal and refresh ScrollTrigger.
  useEffect(() => {
    let loaded = 0;
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      setReady(true);
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const bump = () => {
      loaded += 1;
      if (cancelled) return;
      setLoadProgress(loaded / CRITICAL_ASSETS.length);
      if (loaded >= CRITICAL_ASSETS.length) finish();
    };
    CRITICAL_ASSETS.forEach((src) => {
      const img = new window.Image();
      img.onload = bump;
      img.onerror = bump;
      img.src = src;
    });
    const failsafe = window.setTimeout(finish, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, []);

  useLenis(ready && !reducedMotion);
  usePortfolioAnimation({
    heroRef,
    trackRef,
    cardRefs,
    orbitPathRefs,
    orbitRef,
    nameARef,
    nameBRef,
    indicatorRef,
    totalCards: PROJECTS.length,
    enabled: !reducedMotion,
    onActiveSlotChange,
  });

  if (reducedMotion) {
    return (
      <>
        <Navigation />
        <main>
          <StaticShowcase />
        </main>
      </>
    );
  }

  const accent = PROJECTS[activeIndex]?.accent ?? PROJECTS[0].accent;

  return (
    <>
      <Navigation />
      <main>
        <section
          ref={heroRef}
          className={styles.hero}
          style={{ "--accent": accent } as React.CSSProperties}
          aria-label="Selected work"
        >
          <h1 className={styles.visuallyHidden}>
            Adnan Afana — Senior Product Designer
          </h1>

          <div className={styles.ambient} aria-hidden="true" />
          <div className={styles.accentGlow} aria-hidden="true" />

          <BackgroundTypography ref={nameARef} word="Adnan" position="upper" />
          <BackgroundTypography ref={nameBRef} word="Afana" position="lower" />

          <OrbitLines ref={orbitRef} pathRefs={orbitPathRefs} />

          <div
            className={styles.portraitSlot}
            style={{ zIndex: PORTRAIT_Z_INDEX }}
          >
            <Portrait />
          </div>

          <ProjectTrack ref={trackRef} cardRefs={cardRefs} />

          <ProjectCounter activeIndex={activeIndex} />
          <ScrollIndicator ref={indicatorRef} />
        </section>
      </main>

      <Loader progress={loadProgress} hidden={ready} />
    </>
  );
}
