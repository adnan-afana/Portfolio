"use client";

import { forwardRef, RefObject, useCallback } from "react";
import { PROJECTS } from "@/data/projects";
import ProjectCard from "./ProjectCard";
import styles from "./portfolio.module.css";

type Props = {
  cardRefs: RefObject<(HTMLElement | null)[]>;
};

const TOTAL = PROJECTS.length;

/**
 * Maps each project (in narrative order) to a slot on the loop so that
 * projects become active in 01 → 08 order as the user scrolls.
 * Slot k's loop offset is k/N; slots reach the front in the order
 * 0, N-1, N-2 … 1, hence the (N - i) % N mapping.
 */
export const slotForIndex = (index: number): number => (TOTAL - index) % TOTAL;

const ProjectTrack = forwardRef<HTMLDivElement, Props>(function ProjectTrack(
  { cardRefs },
  ref
) {
  const registerRef = useCallback(
    (slot: number, el: HTMLElement | null) => {
      if (cardRefs.current) cardRefs.current[slot] = el;
    },
    [cardRefs]
  );

  return (
    <div ref={ref} className={styles.track}>
      {PROJECTS.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          slot={slotForIndex(index)}
          priority={index < 2}
          registerRef={registerRef}
        />
      ))}
    </div>
  );
});

export default ProjectTrack;
