import styles from "./portfolio.module.css";

export default function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <a href="/" className={styles.navLogo} aria-label="Adnan Afana — home">
        AA
      </a>

      <div className={styles.navLinks}>
        <a href="#work" className={styles.navLink}>
          Work
        </a>
        <a href="#about" className={styles.navLink}>
          About
        </a>
        <a href="#resume" className={styles.navLink}>
          Resume
        </a>
      </div>

      <div className={styles.navRight}>
        <button
          type="button"
          className={styles.themeToggle}
          aria-label="Toggle theme (coming soon)"
          data-theme-toggle
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
          </svg>
        </button>
        <a href="mailto:adnanafana0@gmail.com" className={styles.talkButton}>
          Let&rsquo;s talk <span className={styles.talkArrow}>↗</span>
        </a>
      </div>
    </nav>
  );
}
