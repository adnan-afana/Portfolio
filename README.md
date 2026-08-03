# Adnan Afana — Portfolio

A premium one-section portfolio homepage. The page stays visually fixed at
100vh while scrolling drives a long, reversible 3D animation: eight project
cards ride a curved ribbon that rises from the lower-left, sweeps through
the foreground, recedes to the upper-right and wraps behind the portrait.

Built with **Next.js (App Router) · React · TypeScript · GSAP ScrollTrigger ·
Lenis · CSS 3D transforms · CSS Modules**. No Three.js — the cards are real
HTML: text stays sharp, links stay clickable, content stays editable.

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## Folder structure

```
src/
  app/
    layout.tsx              Root layout + Geist font
    page.tsx                Renders PortfolioHero
    globals.css             Color tokens & resets
    fonts/                  Geist variable woff2 (self-hosted)
  components/portfolio/
    PortfolioHero.tsx       Composition root, loading state, active project
    Navigation.tsx          Fixed top nav
    BackgroundTypography.tsx  Oversized "Adnan" / "Afana" background words
    Portrait.tsx            Central portrait + mouse parallax
    OrbitLines.tsx          SVG guide rails + glowing nodes
    ProjectTrack.tsx        Maps projects onto ribbon slots
    ProjectCard.tsx         One card (memoized, cheap to transform)
    ProjectCounter.tsx      "08 PROJECTS" + active project
    ScrollIndicator.tsx     Fades out once scrolling starts
    Loader.tsx              Minimal preload overlay
    StaticShowcase.tsx      Reduced-motion fallback (plain list)
    portfolio.module.css    All styling
  data/
    projects.ts             ← EDIT THIS to change project content
  hooks/
    useLenis.ts             Lenis ↔ GSAP ticker sync
    usePortfolioAnimation.ts  The master ScrollTrigger + render loop
    useReducedMotion.ts
  lib/
    curve.ts                Ribbon path (Catmull-Rom loop) + card transforms
    animation.ts            ← EDIT THIS to tune the animation
    math.ts                 clamp / lerp / wrap01 / smoothstep helpers
public/images/
  portrait.png              ← replace with your transparent-background PNG
  projects/project-0X.webp  ← replace with real screenshots (≈1200×760)
```

## Replacing content

1. **Portrait** — export a transparent-background PNG (≈900×1170) and
   overwrite `public/images/portrait.png`. Keep the subject bottom-anchored;
   the CSS mask fades the bottom edge into the page.
2. **Screenshots** — drop files into `public/images/projects/` and point
   each project's `image` field at them (webp preferred, ~1200×760).
3. **Titles / descriptions / links / accents** — all in
   `src/data/projects.ts`. Nothing else needs to change.

## Animation architecture

- **One ScrollTrigger** pins the hero (`start: "top top"`,
  `end: "+=<pages>×100vh"`, `scrub: 1.2`) and reports a 0→1 progress.
- **One render function** (`usePortfolioAnimation`) derives every layer from
  that progress and writes DOM transforms directly — no React state on the
  hot path. React state changes only when the active project changes.
- **The curve** (`src/lib/curve.ts`) is a closed loop of 10 control points
  sampled with Catmull-Rom interpolation. Each point carries `x, y`
  (viewport fractions) and `z` (depth, −1 back … +1 front). Card *i* samples
  the loop at `wrap01(baseOffset + i/8 + progress × travel)`:
  - position ← `(x·vw, y·vh)`
  - scale, opacity, z-index ← mapped from `z`
  - rotateY/rotateZ ← path tangent (including the depth component)
- **Portrait layering** — the portrait sits at a fixed `z-index: 50`
  (`PORTRAIT_Z_INDEX`); cards map depth to z-index 10–90, so they genuinely
  pass behind and in front of it.
- **Slot mapping** — `slotForIndex` in `ProjectTrack.tsx` arranges projects
  so they hit the front position in 01→08 order.
- **Phases** — entry (cards rise from below, lines draw in) ends at
  `entryEnd` (8%); the main rotation runs to `exitStart` (94%); the exit
  drift lifts the ribbon up-and-right to a graceful finish. Scrolling back
  up reverses everything.

## Tuning guide (all in `src/lib/animation.ts` unless noted)

| What | Where |
| --- | --- |
| Scroll length / speed | `pages` (7 = 700vh of scroll per breakpoint) |
| Scrub smoothing | `scrub: 1.2` in `usePortfolioAnimation.ts` |
| Curve shape | `RIBBON_PATH` control points in `lib/curve.ts` |
| Card spacing | implicit `1/totalCards`; shift `baseOffset` to re-phase |
| Depth intensity | `depthPx`, `minScale`/`maxScale`, `minOpacity` |
| Rotation feel | `turnFactor`/`maxTurn` (Y), `tiltFactor`/`maxTilt` (Z) |
| Behind-portrait cutoff | `backThreshold` (depth below which cards blur) |
| Active-project timing | threshold `0.42 / totalCards` in the hook |
| Entry / exit windows | `entryEnd`, `exitStart` |
| Card size | `.card` width/height per breakpoint in `portfolio.module.css` |

## Accessibility & fallbacks

- `prefers-reduced-motion` renders a static, unpinned list of all projects.
- Cards are anchors with focus states; the active project is announced via
  `aria-live` in the counter; decorative layers are `aria-hidden`.

## Notes

- The current portrait and screenshots are **generated placeholders** so the
  composition reads end-to-end — swap them for real assets.
- The theme toggle is visual-only for now; tokens live on `:root` so a light
  theme can be added by swapping CSS variables.
