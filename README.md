# Adnan Afana — Portfolio

Personal portfolio of Adnan Afana, AI Product Designer based in Kingston, Ontario, Canada.

A static, single-page site with scroll-driven motion: a loader, smooth scrolling, and a **Work / In the field** toggle with a curtain transition.

- **Work** has case studies for LeaseTeq, Shannon Trust: Turning Pages, Abacus Mobile App, MonMedX, Magrabi Hospitals, Booka and a cold-room control system. Each project's preview is rebuilt as live HTML, SVG and CSS with its own animation.
- **In the field** covers workshops, talks, consulting, mentoring and community in Kingston: a photo gallery, an upcoming-event card, past workshops, consulting and mentoring, community organizations and a writing section.

Live: https://adnanafana.com

## Structure

```
index.html          page markup
api/chat.js         Ask AI backend (Vercel function)
chat-knowledge.md   what the Ask AI assistant knows and how it answers
css/site.css        styles
js/site.js          interactions and animation
assets/images/      project imagery
assets/images/field/ In the field gallery photos
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

The libraries load from CDNs.

## Ask AI about me

The chat panel posts to `api/chat.js`, a Vercel serverless function that streams answers from Claude (Haiku by default).

**To change what the assistant knows or how it answers, edit `chat-knowledge.md`** (plain language: rules, set answers, profile, case studies). Notes inside `<!-- -->` are ignored by the AI. Edit it on github.com and Vercel republishes automatically.

Answers can include layout blocks the AI picks per question: list, cards, accordion, steps, timeline, stats, quote and buttons. The site renders them in its own style (`js/site.js` and the `.blk-*` styles in `css/site.css`); the AI never writes HTML.

- Set `ANTHROPIC_API_KEY` in the Vercel project's environment variables (Production and Preview). Optional: `CHAT_MODEL` to change the model.
- Guard rails: only the last 10 messages are sent, visitor messages are capped at 500 characters, answers at 400 tokens, requests from other sites are refused, and each IP gets 20 questions per 10 minutes.
- To test the chat locally, run `vercel dev` instead of `npx serve .` (a plain static server has no `/api`).

## Updating In the field

All content lives in `index.html`, inside `<div id="activities">`.

- **Upcoming events** use `data-show-until="YYYY-MM-DD"`, and the matching past-workshop entry uses `data-show-from="YYYY-MM-DD"`. After the event date, the card hides itself and the entry appears under Workshops & talks, with no code change needed. The "In N days" label comes from `data-countdown`.
- **Gallery photos** go in `assets/images/field/` as `.webp` (about 1400px on the long side) and are added as an `<li class="fld-shot-item">` in `#fldStrip`. Every photo is shown in the same 4:3 frame. Add `class="is-slide"` or `class="is-poster"` to show a slide or poster in full instead of cropping it.
- **Topics line** under the title has a desktop version (`.fld-eb-d`) and a phone version (`.fld-eb-m`).

## Deploy

The live site is the Vercel project `adnan-afana-portfolio`, deployed from this repository's root with no build step, and served at adnanafana.com (www redirects to it). `vercel.json` sends old case-study URLs from the previous site (`/project/...`) to the matching case study.
