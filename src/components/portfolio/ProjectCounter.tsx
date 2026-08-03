"use client";

import { PROJECTS } from "@/data/projects";
import styles from "./portfolio.module.css";

type Props = { activeIndex: number };

export default function ProjectCounter({ activeIndex }: Props) {
  const active = PROJECTS[activeIndex] ?? PROJECTS[0];
  return (
    <div className={styles.counter}>
      <span className={styles.counterDot} aria-hidden="true" />
      <div className={styles.counterTotal}>
        {String(PROJECTS.length).padStart(2, "0")}
      </div>
      <div className={styles.counterLabel}>Projects</div>
      <div className={styles.counterActive} aria-live="polite">
        {String(activeIndex + 1).padStart(2, "0")} — {active.title}
      </div>
    </div>
  );
}
