/**
 * PROJECT DATA — edit this file to update the portfolio content.
 *
 * To replace a project:
 *  1. Drop a screenshot into  public/images/projects/  (≈1200×760, webp preferred)
 *  2. Update `image` to point at it
 *  3. Update title / category / description / href / accent
 *
 * The animation reads this array — no animation code needs to change.
 */

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  accent: string;
  href: string;
};

export const PROJECTS: Project[] = [
  {
    id: "leaseteq",
    title: "LeaseTeq",
    category: "Fintech",
    description:
      "Enterprise leasing platform for automotive dealers and lending companies.",
    image: "/images/projects/project-01.webp",
    accent: "#4d7cfe",
    href: "/work/leaseteq",
  },
  {
    id: "shannon-trust",
    title: "Shannon Trust",
    category: "Identity",
    description:
      "Digital trust platform for secure document verification and identity assurance.",
    image: "/images/projects/project-02.webp",
    accent: "#38b178",
    href: "/work/shannon-trust",
  },
  {
    id: "monmedx",
    title: "MONMEDX",
    category: "Healthcare",
    description:
      "Healthcare management system for clinics and laboratories.",
    image: "/images/projects/project-03.webp",
    accent: "#8a6bff",
    href: "/work/monmedx",
  },
  {
    id: "abacus",
    title: "Abacus",
    category: "EdTech · AI",
    description:
      "AI learning app that personalizes education for every student.",
    image: "/images/projects/project-04.webp",
    accent: "#f08c3a",
    href: "/work/abacus",
  },
  {
    id: "numa",
    title: "Numa",
    category: "Voice AI",
    description:
      "Voice AI platform for automotive dealerships and customer support.",
    image: "/images/projects/project-05.webp",
    accent: "#3fae64",
    href: "/work/numa",
  },
  {
    id: "magrabi",
    title: "Magrabi",
    category: "Retail",
    description:
      "Omnichannel retail experience platform for custom optics.",
    image: "/images/projects/project-06.webp",
    accent: "#e0567c",
    href: "/work/magrabi",
  },
  {
    id: "dash",
    title: "Dash",
    category: "Analytics",
    description:
      "Analytics dashboard for business performance monitoring.",
    image: "/images/projects/project-07.webp",
    accent: "#39a9db",
    href: "/work/dash",
  },
  {
    id: "kausal",
    title: "Kausal",
    category: "AI Research",
    description:
      "AI research assistant for summarizing insights from literature reviews.",
    image: "/images/projects/project-08.webp",
    accent: "#a3c645",
    href: "/work/kausal",
  },
];
