# Adnan Afana — Portfolio

Personal portfolio of Adnan Afana, AI Product Designer based in Ontario, Canada.

A static, single-page site with scroll-driven motion: a loader, smooth scrolling, a Work / Activities toggle with a curtain transition, and case studies for LeaseTeq, Shannon Trust: Turning Pages, Abacus Mobile App, MonMedX, Magrabi Hospitals, Boka and a cold-room control system. Each project's preview is rebuilt as live HTML, SVG and CSS with its own animation.

Live: https://adnan-afana-portfolio.vercel.app

## Structure

```
index.html          page markup
css/site.css        styles
js/site.js          interactions and animation
assets/images/      project imagery
```

## Run locally

No build step. Serve the folder with any static server, for example:

```
npx serve .
```

## Stack

- [GSAP](https://gsap.com) 3.12.5 + ScrollTrigger
- [Lenis](https://github.com/darkroomengineering/lenis) 1.1.13 smooth scroll
- Google Fonts: Archivo, Instrument Sans, IBM Plex Mono, Source Sans 3

The libraries load from CDNs. The "Ask AI about me" chat stays hidden on this static build until it has a backend.
