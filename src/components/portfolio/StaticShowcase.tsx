import Image from "next/image";
import { PROJECTS } from "@/data/projects";
import styles from "./portfolio.module.css";

/**
 * Reduced-motion fallback: no pinning, no scroll animation — a calm,
 * fully accessible list of the same eight projects.
 */
export default function StaticShowcase() {
  return (
    <div className={styles.staticShowcase}>
      <header className={styles.staticHero}>
        <div className={styles.staticPortrait}>
          <Image
            src="/images/portrait.png"
            alt="Portrait of Adnan Afana"
            width={360}
            height={468}
            priority
          />
        </div>
        <h1 className={styles.staticName}>Adnan Afana</h1>
        <p className={styles.staticRole}>Senior Product Designer</p>
      </header>

      <ul className={styles.staticList} id="work">
        {PROJECTS.map((project, i) => (
          <li key={project.id}>
            <a href={project.href} className={styles.staticCard}>
              <span className={styles.staticIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={styles.staticShot}>
                <Image
                  src={project.image}
                  alt={`${project.title} interface preview`}
                  width={480}
                  height={304}
                />
              </div>
              <div>
                <span className={styles.cardCategory}>{project.category}</span>
                <h2 className={styles.staticTitle}>{project.title}</h2>
                <p className={styles.cardDescription}>{project.description}</p>
                <span className={styles.cardCta}>View case study ↗</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
