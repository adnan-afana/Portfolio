"use client";

import { forwardRef } from "react";
import styles from "./portfolio.module.css";

const ScrollIndicator = forwardRef<HTMLDivElement>(function ScrollIndicator(
  _props,
  ref
) {
  return (
    <div ref={ref} className={styles.scrollIndicator}>
      <span>Scroll</span>
      <span className={styles.scrollIndicatorLine} aria-hidden="true" />
    </div>
  );
});

export default ScrollIndicator;
