"use client";

import styles from "./portfolio.module.css";

type Props = { progress: number; hidden: boolean };

export default function Loader({ progress, hidden }: Props) {
  return (
    <div
      className={`${styles.loader} ${hidden ? styles.loaderHidden : ""}`}
      aria-hidden={hidden}
    >
      <div className={styles.loaderMark}>AA</div>
      <div className={styles.loaderBar} role="progressbar" aria-label="Loading">
        <div
          className={styles.loaderBarFill}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <div className={styles.loaderPct}>{Math.round(progress * 100)}</div>
    </div>
  );
}
