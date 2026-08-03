"use client";

import { forwardRef, RefObject } from "react";
import styles from "./portfolio.module.css";

type Props = {
  pathRefs: RefObject<(SVGPathElement | null)[]>;
};

/**
 * Two perspective guide rails that trace the project ribbon, plus a few
 * softly glowing nodes. Drawn in via stroke-dashoffset as scrolling starts.
 */
const OrbitLines = forwardRef<SVGSVGElement, Props>(function OrbitLines(
  { pathRefs },
  ref
) {
  const setPath = (i: number) => (el: SVGPathElement | null) => {
    if (pathRefs.current) pathRefs.current[i] = el;
  };

  return (
    <svg
      ref={ref}
      className={styles.orbitLines}
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        ref={setPath(0)}
        className={styles.orbitPath}
        pathLength={1}
        d="M -60 700 C 180 760 520 740 780 640 C 1080 525 1300 400 1400 280 C 1460 205 1420 150 1300 145 C 1080 135 780 170 520 205 C 260 240 40 300 -40 380"
      />
      <path
        ref={setPath(1)}
        className={styles.orbitPath}
        pathLength={1}
        d="M -60 800 C 220 860 560 830 830 715 C 1130 585 1360 440 1450 320"
      />
      <circle className={styles.orbitNode} cx="1258" cy="265" r="3" />
      <circle className={styles.orbitNodeSmall} cx="330" cy="742" r="2.4" />
      <circle className={styles.orbitNodeSmall} cx="86" cy="330" r="2.4" />
    </svg>
  );
});

export default OrbitLines;
