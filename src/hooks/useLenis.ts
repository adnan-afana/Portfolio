"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Smooth scrolling synchronized with GSAP's ticker so ScrollTrigger and
 * Lenis share one clock. Disabled entirely for reduced motion.
 */
export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [enabled]);
}
