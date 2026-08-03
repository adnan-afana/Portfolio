"use client";

import { memo, useCallback, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import type { Project } from "@/data/projects";
import styles from "./portfolio.module.css";

type Props = {
  project: Project;
  index: number;
  slot: number;
  priority: boolean;
  registerRef: (slot: number, el: HTMLElement | null) => void;
};

/**
 * One project card on the ribbon. The outer <article> is transformed by the
 * animation loop; everything inside is static so the card stays cheap.
 */
const ProjectCard = memo(function ProjectCard({
  project,
  index,
  slot,
  priority,
  registerRef,
}: Props) {
  const shotRef = useRef<HTMLDivElement>(null);
  const parallax = useRef<{
    x: ReturnType<typeof gsap.quickTo>;
    y: ReturnType<typeof gsap.quickTo>;
  } | null>(null);

  const setRef = useCallback(
    (el: HTMLElement | null) => registerRef(slot, el),
    [registerRef, slot]
  );

  // Screenshot drifts 2–3px with the cursor, only while the card is active.
  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    if (!card.classList.contains("is-active") || !shotRef.current) return;
    if (!parallax.current) {
      parallax.current = {
        x: gsap.quickTo(shotRef.current, "x", { duration: 0.6, ease: "power2.out" }),
        y: gsap.quickTo(shotRef.current, "y", { duration: 0.6, ease: "power2.out" }),
      };
    }
    const r = card.getBoundingClientRect();
    parallax.current.x(((e.clientX - r.left) / r.width - 0.5) * 6);
    parallax.current.y(((e.clientY - r.top) / r.height - 0.5) * 4);
  };

  const onMouseLeave = () => {
    parallax.current?.x(0);
    parallax.current?.y(0);
  };

  return (
    <article
      ref={setRef}
      className={styles.card}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      data-slot={slot}
    >
      <a
        href={project.href}
        className={styles.cardLink}
        aria-label={`${project.title} — view case study`}
      >
        <div className={styles.cardBody}>
          <div className={styles.cardInfo}>
            <span
              className={styles.cardIcon}
              style={{ backgroundColor: project.accent }}
              aria-hidden="true"
            >
              {project.title.charAt(0)}
            </span>
            <span className={styles.cardCategory}>{project.category}</span>
            <h2 className={styles.cardTitle}>{project.title}</h2>
            <p className={styles.cardDescription}>{project.description}</p>
            <span className={styles.cardCta}>
              View case study <span className={styles.cardCtaArrow}>↗</span>
            </span>
          </div>
          <div className={styles.cardShotFrame}>
            <div ref={shotRef} className={styles.cardShot}>
              <Image
                src={project.image}
                alt={`${project.title} interface preview`}
                fill
                sizes="(max-width: 767px) 60vw, 320px"
                priority={priority}
                className={styles.cardShotImage}
              />
            </div>
          </div>
        </div>
        <span className={styles.cardIndex} aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      </a>
    </article>
  );
});

export default ProjectCard;
