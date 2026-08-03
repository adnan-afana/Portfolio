"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import styles from "./portfolio.module.css";

/**
 * The central portrait. Cards sort themselves around its fixed z-index,
 * which is what creates the pass-behind / pass-in-front depth effect.
 * Replace /public/images/portrait.png with a transparent-background PNG.
 */
export default function Portrait() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(wrap, "x", { duration: 0.9, ease: "power2.out" });
    const yTo = gsap.quickTo(wrap, "y", { duration: 0.9, ease: "power2.out" });

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      xTo(nx * -6);
      yTo(ny * -4);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className={styles.portraitLayer}>
      <div className={styles.portraitGlow} aria-hidden="true" />
      <div ref={wrapRef} className={styles.portraitWrap}>
        <Image
          src="/images/portrait.png"
          alt="Portrait of Adnan Afana"
          width={900}
          height={1170}
          priority
          className={styles.portraitImage}
        />
      </div>
    </div>
  );
}
