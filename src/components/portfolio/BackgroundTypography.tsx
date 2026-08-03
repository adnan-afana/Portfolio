"use client";

import { forwardRef } from "react";
import styles from "./portfolio.module.css";

type Props = { word: string; position: "upper" | "lower" };

/**
 * One oversized low-contrast background word. Rendered as a decorative
 * layer — the real page h1 lives in PortfolioHero (visually hidden).
 */
const BackgroundTypography = forwardRef<HTMLDivElement, Props>(
  function BackgroundTypography({ word, position }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`${styles.bgWord} ${
          position === "upper" ? styles.bgWordUpper : styles.bgWordLower
        }`}
      >
        {word}
      </div>
    );
  }
);

export default BackgroundTypography;
