(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Toronto clock ---------- */
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const clock = () => { const t = fmt.format(new Date()); $$('[data-clock]').forEach(e => e.textContent = t); };
  clock(); setInterval(clock, 1000);

  /* ---------- rotating word: build → customize → evolve ---------- */
  (function rotator() {
    const r = $('#rot'); if (!r || reduce) return;
    const words = [...r.children]; let i = 0;
    setInterval(() => {
      const cur = words[i]; i = (i + 1) % words.length; const next = words[i];
      cur.classList.remove('is-in'); cur.classList.add('is-out');
      next.classList.remove('is-out'); next.classList.add('is-in');
      setTimeout(() => cur.classList.remove('is-out'), 750);
    }, 2500);
  })();

  /* ---------- copy email ---------- */
  const EMAIL = 'adnanafana0@gmail.com';
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const label = b.querySelector('.btn-label');
    const orig = label.dataset.text || (label.dataset.text = label.textContent);
    try { await navigator.clipboard.writeText(EMAIL); label.textContent = 'Copied'; }
    catch (e) {
      const r = document.createRange(); r.selectNodeContents($('#emailText'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); label.textContent = 'Email selected';
    }
    setTimeout(() => label.textContent = orig, 1600);
  }));

  /* ---------- ask-AI chat (uses the viewer's Claude via the sample capability) ---------- */
  (async function chat() {
    const box = $('#chat'); if (!box || !window.claude || !window.claude.use) return;
    let sample = null;
    try { sample = await window.claude.use('sample'); } catch (e) { sample = null; }
    if (!sample) return;
    box.hidden = false;
    const fab = $('#chatFab'), panel = $('#chatPanel'), log = $('#chatLog'), form = $('#chatForm'), input = $('#chatInput'),
      send = $('#chatSend'), sugg = $('#chatSugg'), closeBtn = $('#chatClose'), cur = $('#cursor');
    box.addEventListener('mouseenter', () => { if (cur) cur.style.opacity = '0'; });
    box.addEventListener('mouseleave', () => { if (cur) cur.style.opacity = ''; });
    const PROFILE = [
      'Name: Adnan Afana',
      'Role: AI Product Designer. Also works across UX, UI and business consulting.',
      'Location: Ontario, Canada (Toronto time zone).',
      'Summary: Adnan builds, customizes and evolves digital products, including enterprise systems, SaaS and AI-powered apps, from idea to launch and beyond.',
      'Experience: about 5 years in product and UX design.',
      '- Founder & AI Product Builder at PrefPick.',
      '- AI Consultant & Workshop Facilitator for the Kingston business community.',
      '- Product Design Consultant for international clients.',
      '- Product Designer at LeaseTeq.',
      '- Freelance Product & UX/UI Designer on Upwork.',
      '- Freelancing Coach & Mentor at Mercy Corps.',
      '- Earlier: Product Designer at Yalla Cooperative; UX/UI Designer at Bitlab; UX/UI Designer at Afdal.',
      'Focus areas: AI product design, interaction design, motion systems, prototyping, design systems, product strategy. He works across business, design and technology, validating ideas through research and interviews. He turns bold ideas and tough challenges into real products, and guides strategy, design, development, launch and ongoing improvement.',
      'Toolkit: Figma, GSAP, ScrollTrigger, Lenis, prototyping, AI content tools, design systems.',
      'Selected work on the site: LeaseTeq (2026, multi-portal vehicle leasing platform for customers, dealers and operations); Shannon Trust: Turning Pages (2023, accessible literacy platform for prison learners); Abacus Mobile App (2023, mental math app for children); MonMedX (2022, healthcare SaaS for clinics); Magrabi Hospitals & Centers (2023, accessible hospital website); Boka (2022, beauty and wellness booking apps). Each card links to the full case study on adnanafana.com.',
      'Availability: the site invites companies hiring a senior product designer to get in touch.',
      'Contact: email adnanafana0@gmail.com.'
    ].join('\n');
    const RULES = "You are the assistant on Adnan Afana's portfolio website. Answer visitors' questions about Adnan using ONLY the profile below.\n" +
      '- Reply in plain text, 1 to 3 short sentences, warm and professional, referring to Adnan in the third person.\n' +
      "- If the profile does not cover the question, say it isn't listed on the site and suggest emailing Adnan at adnanafana0@gmail.com.\n" +
      '- Never invent clients, dates, metrics, salaries or personal details.\n' +
      '- If asked about something unrelated to Adnan, briefly say you can only answer questions about him.\n\nPROFILE\n' + PROFILE;
    const COPY = {
      rate_limited: 'Lots of questions right now. Please try again in a minute.',
      session_expired: 'Please sign in to Claude again to keep chatting.',
      refused: "I can't help with that one. Try asking about Adnan's work or experience.",
      empty_completion: "I didn't get an answer for that. Try rephrasing your question.",
      prompt_too_large: 'This conversation got long. Refresh the page to start a new one.'
    };
    const OFF = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
    const turns = []; let busy = false, ctl = null, dead = false;
    const open = v => { panel.hidden = !v; fab.setAttribute('aria-expanded', String(v)); if (v) setTimeout(() => input.focus(), 50); };
    fab.addEventListener('click', () => open(panel.hidden));
    closeBtn.addEventListener('click', () => { open(false); fab.focus(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) open(false); });
    const add = (cls, text) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
    const settle = (bubble, text) => { bubble.className = 'msg bot'; bubble.textContent = text; };
    async function ask(q) {
      q = String(q || '').trim(); if (!q || busy || dead) return;
      busy = true; send.textContent = 'Stop'; sugg.hidden = true;
      add('user', q); input.value = '';
      turns.push({ role: 'user', content: q });
      const bubble = add('bot thinking', 'Thinking…');
      ctl = new AbortController();
      try {
        const { text } = await sample([{ role: 'user', content: RULES }, ...turns.slice(-10)], {
          modelTier: 'quick', cache: false, signal: ctl.signal,
          onText: ({ text }) => { settle(bubble, text); log.scrollTop = log.scrollHeight; }
        });
        settle(bubble, text);
        turns.push({ role: 'assistant', content: text });
      } catch (e) {
        const code = e && e.code;
        if (code === 'cancelled') {
          if (e.text) { settle(bubble, e.text); turns.push({ role: 'assistant', content: e.text }); } else { bubble.remove(); turns.pop(); }
        } else if (OFF.includes(code)) {
          bubble.className = 'msg err';
          bubble.textContent = "The AI chat isn't available in this view. You can still email Adnan at adnanafana0@gmail.com.";
          dead = true; input.disabled = true; send.disabled = true; turns.pop();
        } else if (e && e.text) {
          settle(bubble, e.text); turns.push({ role: 'assistant', content: e.text });
          add('err', 'The answer was cut off. Try asking again.');
        } else {
          bubble.className = 'msg err'; bubble.textContent = COPY[code] || 'Something went wrong. Please try again.'; turns.pop();
        }
      } finally {
        busy = false; ctl = null; if (!dead) send.textContent = 'Send'; log.scrollTop = log.scrollHeight;
      }
    }
    form.addEventListener('submit', e => { e.preventDefault(); if (busy && ctl) { ctl.abort(); return; } ask(input.value); });
    $$('button', sugg).forEach(b => b.addEventListener('click', () => ask(b.textContent)));
  })();

  /* ---------- text scramble on hover ---------- */
  const GLYPHS = '#%&*+=<>/|';
  function scramble(el) {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    cancelAnimationFrame(el._raf);
    const start = performance.now(), dur = 420;
    const step = now => {
      const p = Math.min(1, (now - start) / dur), shown = Math.floor(p * final.length);
      let out = '';
      for (let i = 0; i < final.length; i++) out += (i < shown || final[i] === ' ') ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(step); else el.textContent = final;
    };
    el._raf = requestAnimationFrame(step);
  }
  if (!reduce) $$('[data-scramble]').forEach(host => {
    const target = host.querySelector('.sc') || host;
    host.addEventListener('mouseenter', () => scramble(target));
    host.addEventListener('focus', () => scramble(target));
  });


  /* ---------- smooth scroll ---------- */
  let lenis = null, scrollY = window.scrollY, velocity = 0;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', e => { scrollY = e.scroll; velocity = e.velocity; onScroll(); if (hasGsap) ScrollTrigger.update(); });
    if (hasGsap) { gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  } else {
    let last = window.scrollY;
    addEventListener('scroll', () => { scrollY = window.scrollY; velocity = scrollY - last; last = scrollY; onScroll(); }, { passive: true });
  }
  /* ---------- In the field: date-driven upcoming/past + countdown ---------- */
  (function fieldDates() {
    const d0 = new Date(); const today = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
    const day = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    $$('[data-show-until]').forEach(el => { if (today > day(el.dataset.showUntil)) el.hidden = true; });
    $$('[data-show-from]').forEach(el => { if (today >= day(el.dataset.showFrom)) el.hidden = false; });
    $$('[data-countdown]').forEach(el => {
      const n = Math.round((day(el.dataset.countdown) - today) / 864e5);
      el.textContent = n > 1 ? 'In ' + n + ' days' : n === 1 ? 'Tomorrow' : n === 0 ? 'Today' : 'Past';
    });
  })();
  /* ---------- Work / Activities toggle ---------- */
  const toggle = $('#viewToggle'), tInd = $('#toggleInd'), tabs = $$('[data-view]', toggle);
  const views = { work: $('#workView'), activities: $('#activities') };
  let view = 'work';
  const placeInd = () => { const b = $('.is-on', toggle); tInd.style.width = b.offsetWidth + 'px'; tInd.style.transform = `translateX(${b.offsetLeft}px)`; };
  placeInd(); toggle.classList.add('ready');
  addEventListener('resize', placeInd);
  if (document.fonts) document.fonts.ready.then(placeInd);
  function goTo(target) {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -60, duration: 1.4 });
    else if (target === 0) scrollTo(0, 0); else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  let switching = false;
  function jump(target) {
    if (lenis) lenis.scrollTo(target, { offset: -80, immediate: true, force: true });
    else { const y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo(0, Math.max(0, y)); }
  }
  function setView(v, target) {
    if (switching) return;
    if (v === view) { goTo(target || views[v]); return; }
    view = v;
    tabs.forEach(b => { const on = b.dataset.view === v; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    placeInd();
    const show = views[v], hide = views[v === 'work' ? 'activities' : 'work'];
    const swap = () => {
      hide.hidden = true; show.hidden = false;
      document.body.classList.toggle('is-field', v === 'activities');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      jump(target || (v === 'work' ? 0 : show));
    };
    if (!window.gsap || reduce) { swap(); return; }
    switching = true;
    const vt = $('#vt'), slats = $$('#vt i'), lbl = $('#vtLabel');
    lbl.textContent = ($('[data-view="' + v + '"]') || {}).textContent || (v === 'work' ? 'Work' : 'In the field');
    vt.classList.add('on');
    gsap.timeline({ onComplete: () => { vt.classList.remove('on'); gsap.set(slats, { clearProps: 'transform,transformOrigin' }); switching = false; } })
      .set(slats, { transformOrigin: '50% 100%' })
      .to(slats, { scaleY: 1, duration: .55, ease: 'expo.inOut', stagger: { each: .045, from: 'start' } })
      .fromTo(lbl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, '-=.2')
      .add(swap)
      .set(slats, { transformOrigin: '50% 0%' })
      .to(lbl, { opacity: 0, y: -10, duration: .25, ease: 'power2.in' }, '+=.2')
      .to(slats, { scaleY: 0, duration: .65, ease: 'expo.inOut', stagger: { each: .045, from: 'start' } }, '<')
      .fromTo(show.querySelectorAll(':scope > section > *'), { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: .85, ease: 'expo.out', stagger: { amount: .4 }, clearProps: 'transform,opacity' }, '-=.4');
  }
  tabs.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  $$('[data-scrollto]').forEach(a => a.addEventListener('click', e => {
    const sel = a.dataset.scrollto, target = $(sel); if (!target) return;
    e.preventDefault();
    if (views.work.contains(target) && view !== 'work') { setView('work', target); return; }
    goTo(sel === '#top' ? 0 : target);
  }));

  /* ---------- rulers ---------- */
  const rx = $('#rxTicks'), ry = $('#ryTicks'), rxMark = $('#rxMark'), ryMark = $('#ryMark');
  const rxVal = $('#rxVal'), ryVal = $('#ryVal'), prog = $('#ryProg'), corner = $('#corner');
  let ryLabels = [];
  const pointer = { x: -100, y: -100 };
  function buildRulers() {
    if (!rx) return;
    rx.innerHTML = ''; ry.innerHTML = ''; ryLabels = [];
    for (let x = 100; x < innerWidth; x += 100) { const s = document.createElement('span'); s.style.left = x + 'px'; s.textContent = x; rx.appendChild(s); }
    const n = Math.ceil(innerHeight / 100) + 2;
    for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.style.top = (i * 100) + 'px'; ry.appendChild(s); ryLabels.push(s); }
    onScroll();
  }
  function onScroll() {
    if (!ry) return;
    const off = scrollY % 100, base = scrollY - off;
    ry.style.transform = `translateY(${-off}px)`;
    ryLabels.forEach((s, i) => { const v = Math.round(base + i * 100); s.textContent = v === 0 ? '' : v; });
    const max = root.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    prog.style.transform = `scaleY(${p})`;
    corner.textContent = Math.round(p * 100);
    ryVal.textContent = Math.round(scrollY + pointer.y);
  }
  buildRulers();
  addEventListener('resize', () => { buildRulers(); measureHero(); });

  /* ---------- pointer: ruler markers + custom cursor ---------- */
  const cursor = $('#cursor'), cursorLabel = $('#cursorLabel');
  let xTo = null, yTo = null;
  if (fine && hasGsap && !reduce) {
    root.classList.add('has-cursor');
    xTo = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    yTo = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    $$('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-link'));
    });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { cursorLabel.textContent = el.dataset.cursor; cursor.classList.add('is-label'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-label'));
    });
  }
  addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (rxMark) {
      rxMark.style.transform = `translateX(${e.clientX}px)`;
      ryMark.style.transform = `translateY(${e.clientY}px)`;
      rxVal.textContent = Math.round(e.clientX);
      ryVal.textContent = Math.round(scrollY + e.clientY);
    }
    if (xTo) { xTo(e.clientX); yTo(e.clientY); }
  }, { passive: true });

  /* ---------- live measurements ---------- */
  const heroTitle = $('#heroTitle'), heroW = $('#heroW');
  function measureHero() { if (heroW) heroW.textContent = 'W ' + Math.round(heroTitle.getBoundingClientRect().width); }
  measureHero();
  if (document.fonts) document.fonts.ready.then(measureHero);

  /* ---------- headline: same share of the screen width on every device ---------- */
  const HERO_SHARE = 0.7;   // widest headline line = 70% of the viewport width
  function fitHero() {
    const h = heroTitle; if (!h) return;
    const prev = h.style.maxWidth;
    h.style.maxWidth = 'none'; h.style.fontSize = '100px';
    const w100 = h.getBoundingClientRect().width;
    h.style.maxWidth = prev;
    if (!w100) { h.style.fontSize = ''; return; }
    const content = h.parentElement.clientWidth - parseFloat(getComputedStyle(h.parentElement).paddingLeft) - parseFloat(getComputedStyle(h.parentElement).paddingRight);
    const target = innerWidth < 900 ? content : Math.min(innerWidth * HERO_SHARE, content);  // full width on tablets and phones
    h.style.fontSize = Math.min(172, 100 * target / w100).toFixed(2) + 'px';
  }
  fitHero();
  addEventListener('resize', fitHero);
  /* ---------- work: measure everything in the section that isn't card image (padding, heading, titles, text, tags)
     so the image takes exactly the height that's left and the whole card fits one screen ---------- */
  const workMQ = matchMedia('(min-width: 900px) and (min-height: 560px)');
  function fitWork() {
    const work = $('#work'); if (!work) return;
    if (!workMQ.matches) { work.style.removeProperty('--work-chrome'); return; }
    for (let pass = 0; pass < 3; pass++) {  // titles and text rewrap as the card width changes, so settle it in a few passes
      const ws = getComputedStyle(work), inner = $('.work-inner', work), head = $('.sec-head', work);
      const metas = $$('.case-meta', work).map(m => m.offsetHeight);
      const caseGap = parseFloat(getComputedStyle($('.case', work)).rowGap) || 0;
      const chrome = parseFloat(ws.paddingTop) + parseFloat(ws.paddingBottom) + head.offsetHeight + (parseFloat(getComputedStyle(inner).rowGap) || 0) + Math.max(...metas) + caseGap + 2;
      const prev = parseFloat(work.style.getPropertyValue('--work-chrome')) || 0;
      work.style.setProperty('--work-chrome', Math.ceil(chrome) + 'px');
      if (Math.abs(prev - chrome) < 2) break;
    }
  }
  fitWork();
  addEventListener('resize', fitWork);
  if (document.fonts) document.fonts.ready.then(fitWork);
  if (document.fonts) document.fonts.ready.then(() => { fitHero(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  $$('.case').forEach(card => {
    const vis = $('.case-vis', card), dim = $('.dim', card);
    const show = () => { const r = vis.getBoundingClientRect(); dim.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`; };
    card.addEventListener('mouseenter', show); card.addEventListener('focusin', show);
  });

  /* ---------- LeaseTeq live UI: plays once when it comes into view ---------- */
  (function leaseteq() {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window);
    function count(el) {
      if (!el) return;
      const to = +el.dataset.to, t0 = performance.now() + 600, dur = 1800;
      el.textContent = '0';
      const step = t => { const p = Math.min(1, Math.max(0, (t - t0) / dur)); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    const io = still ? null : new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= .3) {
        const lt = e.target; io.unobserve(lt); lt.classList.add('go');
        if (!lt.classList.contains('gs')) { count($('.lt-n', lt)); setTimeout(() => { lt.classList.add('gs'); ltCtl(lt).set(1); }, 2500); }
      }
    }), { threshold: [0, .3] });
    window.ltWatch = lt => {
      lt.classList.remove('arm', 'go', 'gs');
      if (lt._ctl && lt._ctl.loop) lt._ctl.loop.kill(); lt._ctl = null;
      lt.querySelectorAll('.lt-arc,.lt-knob').forEach(el => el.removeAttribute('style'));
      if (still) return;
      lt.classList.add('arm'); const n = $('.lt-n', lt); if (n) n.textContent = '0';
      void lt.offsetWidth; io.observe(lt);
    };
    $$('.lt').forEach(window.ltWatch);
    /* gauge position 0..1: arc fills left to right, dot rides its end, months count up */
    window.ltGauge = (lt, p) => {
      const arc = $('.lt-arc', lt), knob = $('.lt-knob', lt), n = $('.lt-n', lt);
      arc.style.strokeDasharray = (50 * p).toFixed(2) + ' 100'; arc.style.opacity = p > .004 ? 1 : 0;
      knob.style.transform = 'rotate(' + (90 * p).toFixed(2) + 'deg)';
      if (n) n.textContent = Math.round(+n.dataset.to * p);
    };
    /* s = how far the entrance has drawn the gauge; q = the idle loop (empties, then redraws left to right) */
    const vio = still ? null : new IntersectionObserver(es => es.forEach(e => { const c = e.target._ctl; if (!c) return; c.vis = e.isIntersecting; if (c.loop) c.loop.paused(!c.vis); }));
    window.ltCtl = lt => {
      if (lt._ctl) return lt._ctl;
      const c = lt._ctl = { s: 0, q: 1, loop: null, vis: true };
      const draw = () => ltGauge(lt, c.s * c.q);
      c.start = () => {
        if (c.loop || still || !window.gsap) return;
        c.loop = gsap.timeline({ repeat: -1, delay: 2.4, repeatDelay: 2.4, onUpdate: draw })
          .to(c, { q: 0, duration: 1.1, ease: 'power3.inOut' })
          .to(c, { q: 1, duration: 1.8, ease: 'expo.out' }, '+=.25');
        if (!c.vis) c.loop.pause();
      };
      c.stop = () => { if (!c.loop) return; c.loop.kill(); c.loop = null; gsap.to(c, { q: 1, duration: .45, ease: 'power2.out', onUpdate: draw }); };
      c.set = s => { c.s = s; if (s < .999) c.stop(); else c.start(); draw(); };
      if (vio) vio.observe(lt);
      return c;
    };
  })();

  /* ---------- Shannon Trust live UI: learning progress plays on its own loop while the card is on screen ---------- */
  (function shannon() {
    const seg = (p, a, b) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return 1 - Math.pow(1 - t, 3); };
    const rise = (el, t) => { el.style.opacity = t.toFixed(3); el.style.transform = t >= 1 ? '' : 'translateY(calc(var(--u) * ' + ((1 - t) * 7).toFixed(2) + '))'; };
    /* p 0..1: ring draws clockwise as exercises count 0 -> 22%, hours count to 50, the hourglass turns once, last task then milestones rise in */
    window.stSet = (st, p) => {
      const ring = $('.st-ring-fg', st), pct = $('.st-pct', st), hrs = $('.st-hrs', st), glass = $('.st-glass', st), r = seg(p, .05, .7);
      if (ring) { ring.style.strokeDasharray = (22 * r).toFixed(2) + ' 100'; ring.style.opacity = r > .01 ? 1 : 0; }   // arc and % move together, 0 -> 22%
      if (pct) pct.textContent = Math.round(+pct.dataset.to * r) + '%';
      if (hrs) hrs.textContent = Math.round(+hrs.dataset.to * seg(p, 0, .8));
      if (glass) glass.style.transform = p >= 1 ? '' : 'rotate(' + (180 * (1 - seg(p, 0, .55))).toFixed(1) + 'deg)';
      $$('.st-task .st-r', st).forEach((el, i) => rise(el, seg(p, .3 + i * .08, .62 + i * .08)));
      $$('.st-mile .st-r', st).forEach((el, i) => rise(el, seg(p, .42 + i * .07, .74 + i * .07)));
    };
    /* loop on time, not scroll: play the progress in (2.6s), hold 1s, ease it back out, play again right away; paused off screen */
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vio = still || !window.gsap ? null : new IntersectionObserver(es => es.forEach(e => {
      const c = e.target._c; if (!c) return;
      c.vis = e.isIntersecting && e.intersectionRatio > .2;
      if (c.vis && !c.loop) c.loop = gsap.timeline({ repeat: -1, repeatDelay: .2, onUpdate: () => stSet(e.target, c.p) })
        .to(c, { p: 1, duration: 2.6, ease: 'none' })
        .to(c, { p: 0, duration: 1.4, ease: 'power1.inOut' }, '+=1');
      if (c.loop) c.loop.paused(!c.vis);
    }), { threshold: [0, .2] });
    window.stCtl = st => {
      if (st._c) return st._c;
      const c = st._c = { p: 0, loop: null, vis: false };
      if (vio) { stSet(st, 0); vio.observe(st); }   // without motion (or GSAP) the finished screen in the markup stays
      return c;
    };
    $$('.st').forEach(window.stCtl);
  })();

  /* ---------- Abacus live UI: a practice sequence of bead moves, first with the card's entrance, then on a loop ---------- */
  (function abacus() {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
    const io3 = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // beads: gentle start, firm settle
    const WIN = [[0.0263,0.1404],[0.1930,0.3070],[0.3596,0.4737],[0.5263,0.6404],[0.6930,0.8070],[0.8596,0.9737]];   // where each step sits in 0..1; beads in the same step share a window, so they move exactly together
    /* rods counted from the left: rod 1 up, rod 2 down, rods 4 + 5 up, rod 3 down, rod 6 down with rod 7 up, rod 8 up */
    window.abSet = (ab, p) => {
      const beads = ab._mv || (ab._mv = $$('.ab-mv', ab).map(el => [el, WIN[+el.dataset.s], +el.dataset.dy]));
      for (const [el, w, dy] of beads) el.setAttribute('transform', 'translate(0 ' + (dy * io3(seg(p, w[0], w[1]))).toFixed(2) + ')');
    };
    const vio = still ? null : new IntersectionObserver(es => es.forEach(e => { const c = e.target._c; if (!c) return; c.vis = e.isIntersecting; if (c.loop) c.loop.paused(!c.vis); }));
    /* s = entrance progress, q = the loop (holds, plays the sequence back in reverse, pauses, plays it again) */
    window.abCtl = ab => {
      if (ab._c) return ab._c;
      const c = ab._c = { s: 0, q: 1, loop: null, vis: true };
      const draw = () => abSet(ab, c.s * c.q);
      c.start = () => {
        if (c.loop || still || !window.gsap) return;
        c.loop = gsap.timeline({ repeat: -1, delay: 2.2, repeatDelay: 2.2, onUpdate: draw })
          .to(c, { q: 0, duration: 2.736, ease: 'power1.inOut' })
          .to(c, { q: 1, duration: 6.384, ease: 'none' }, '+=.5');
        if (!c.vis) c.loop.pause();
      };
      c.stop = () => { if (!c.loop) return; c.loop.kill(); c.loop = null; gsap.to(c, { q: 1, duration: .45, ease: 'power2.out', onUpdate: draw }); };
      c.set = s => { c.s = s; if (s < .999) c.stop(); else c.start(); draw(); };
      if (vio) vio.observe(ab);
      return c;
    };
  })();

  /* ---------- MonMedX live UI: ECG traces in when the card appears, then sweeps on its own loop; toggles flip at random ---------- */
  (function monmedx() {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PTS = [[430.0,578.0],[431.0,578.0],[431.25,578.01],[431.5,578.05],[431.75,578.16],[432.0,578.41],[432.25,578.81],[432.5,579.25],[432.75,579.49],[433.0,579.36],[433.25,578.9],[433.5,578.15],[433.75,576.87],[434.0,574.36],[434.25,569.93],[434.5,563.9],[434.75,558.32],[435.0,556.03],[435.25,558.44],[435.5,564.29],[435.75,570.89],[436.0,576.3],[436.25,580.06],[436.5,582.38],[436.75,583.38],[437.0,583.15],[437.25,582.0],[437.5,580.56],[437.75,579.34],[438.0,578.57],[438.25,578.2],[438.5,578.05],[438.75,578.0],[439.0,577.98],[439.25,577.96],[439.5,577.95],[440.5,577.8],[441.5,577.46],[442.5,576.83],[443.5,576.05],[444.5,575.48],[445.5,575.48],[446.5,576.05],[447.5,576.83],[448.5,577.46],[449.5,577.8],[450.5,577.95],[451.5,577.99],[452.5,577.98],[453.5,577.92],[454.5,577.68],[455.5,577.18],[456.5,576.6],[457.5,576.41],[458.5,576.81],[459.5,577.41],[460.5,577.81],[461.5,577.96],[462.5,577.99],[463.5,578.0],[464.5,578.01],[464.75,578.04],[465.0,578.13],[465.25,578.34],[465.5,578.72],[465.75,579.17],[466.0,579.47],[466.25,579.42],[466.5,579.01],[466.75,578.33],[467.0,577.2],[467.25,575.0],[467.5,570.98],[467.75,565.16],[468.0,559.26],[468.25,556.12],[468.5,557.61],[468.75,562.97],[469.0,569.62],[469.25,575.36],[469.5,579.43],[469.75,582.02],[470.0,583.29],[470.25,583.28],[470.5,582.28],[470.75,580.84],[471.0,579.55],[471.25,578.69],[471.5,578.25],[471.75,578.07],[472.0,578.0],[472.25,577.98],[472.5,577.97],[472.75,577.95],[473.0,577.93],[474.0,577.75],[475.0,577.35],[476.0,576.68],[477.0,575.9],[478.0,575.43],[479.0,575.56],[480.0,576.2],[481.0,576.97],[482.0,577.55],[483.0,577.84],[484.0,577.96],[485.0,577.99],[486.0,577.98],[487.0,577.89],[488.0,577.6],[489.0,577.06],[490.0,576.51],[491.0,576.45],[492.0,576.93],[493.0,577.51],[494.0,577.85],[495.0,577.97],[496.0,578.0],[497.0,578.0],[498.0,578.03],[498.25,578.1],[498.5,578.29],[498.75,578.63],[499.0,579.08],[499.25,579.43],[499.5,579.46],[499.75,579.12],[500.0,578.49],[500.25,577.48],[500.5,575.57],[500.75,571.95],[501.0,566.41],[501.25,560.31],[501.5,556.41],[501.75,556.94],[502.0,561.7],[502.25,568.32],[502.5,574.34],[502.75,578.75],[503.0,581.61],[503.25,583.14],[503.5,583.38],[503.75,582.53],[504.0,581.13],[504.25,579.78],[504.5,578.83],[504.75,578.31],[505.0,578.09],[505.25,578.01],[505.5,577.98],[505.75,577.97],[506.0,577.95],[506.25,577.93],[507.25,577.77],[508.25,577.38],[509.25,576.71],[510.25,575.94],[511.25,575.44],[512.25,575.54],[513.25,576.16],[514.25,576.94],[515.25,577.52],[516.25,577.84],[517.25,577.96],[518.25,577.99],[519.25,577.98],[520.25,577.9],[521.25,577.63],[522.25,577.09],[523.25,576.53],[524.25,576.44],[525.25,576.9],[526.25,577.49],[527.25,577.84],[528.25,577.97],[529.25,578.0],[530.25,578.0],[531.25,578.02],[531.5,578.08],[531.75,578.24],[532.0,578.55],[532.25,578.99],[532.5,579.38],[532.75,579.49],[533.0,579.21],[533.25,578.64],[533.5,577.73],[533.75,576.06],[534.0,572.84],[534.25,567.63],[534.5,561.45],[534.75,556.88],[535.0,556.45],[535.25,560.51],[535.5,566.98],[535.75,573.25],[536.0,578.0],[536.25,581.15],[536.5,582.93],[536.75,583.43],[537.0,582.77],[537.25,581.43],[537.5,580.02],[537.75,578.98],[538.0,578.39],[538.25,578.12],[538.5,578.02],[538.75,577.99],[539.0,577.97],[539.25,577.96],[539.5,577.94],[540.5,577.78],[541.5,577.4],[542.5,576.75],[543.5,575.98],[544.5,575.45],[545.5,575.52],[546.5,576.12],[547.5,576.9],[548.5,577.5],[549.5,577.83],[550.5,577.95],[551.5,577.99],[552.5,577.98],[553.5,577.91],[554.5,577.65],[555.5,577.12],[556.5,576.55],[557.5,576.43],[558.5,576.87],[559.5,577.46],[560.5,577.83],[561.5,577.96],[562.5,578.0],[563.5,578.0],[564.5,578.02],[564.75,578.06],[565.0,578.19],[565.25,578.48],[565.5,578.9],[565.75,579.32],[566.0,579.5],[566.25,579.29],[566.5,578.77],[566.75,577.95],[567.0,576.49],[567.25,573.64],[567.5,568.81],[567.75,562.66],[568.0,557.52],[568.25,556.14],[568.5,559.42],[568.75,565.63],[569.0,572.1],[569.25,577.18],[569.5,580.63],[569.75,582.68],[570.0,583.43],[570.25,582.97],[570.5,581.72],[570.75,580.28],[571.0,579.15],[571.25,578.47],[571.5,578.16],[571.75,578.03],[572.0,577.99],[572.25,577.97],[572.5,577.96],[572.75,577.94],[573.75,577.79],[574.75,577.43],[575.75,576.79],[576.75,576.01],[577.75,575.47],[578.75,575.5],[579.75,576.09],[580.75,576.87],[581.75,577.48],[582.75,577.81],[583.75,577.95],[584.75,577.99],[585.75,577.98],[586.75,577.91],[587.75,577.66],[588.75,577.15],[589.75,576.58],[590.75,576.42],[591.75,576.84],[592.75,577.44],[593.75,577.82],[594.75,577.96],[595.75,577.99],[596.75,578.0],[597.75,578.01],[598.0,578.05],[598.25,578.16],[598.5,578.41],[598.75,578.81],[599.0,579.25],[599.25,579.49],[599.5,579.36],[599.75,578.9],[600.0,578.15],[600.25,576.87],[600.5,574.36],[600.75,569.93],[601.0,563.9],[601.25,558.32],[601.5,556.03],[601.75,558.44],[602.0,564.29],[602.25,570.89],[602.5,576.3],[602.75,580.06],[603.0,582.38],[603.25,583.38],[603.5,583.15],[603.75,582.0],[604.0,580.56],[604.25,579.34],[604.5,578.57],[604.75,578.2],[605.0,578.05],[605.25,578.0],[605.5,577.98],[605.75,577.96],[606.0,577.95],[607.0,577.8],[608.0,577.46],[609.0,576.83],[610.0,576.05],[611.0,575.48],[612.0,575.48],[613.0,576.05],[614.0,576.83],[615.0,577.46],[616.0,577.8],[617.0,577.95],[618.0,577.99],[619.0,577.98],[620.0,577.92],[621.0,577.68],[622.0,577.18],[623.0,576.6],[624.0,576.41],[625.0,576.81],[626.0,577.41],[627.0,577.81],[628.0,577.96],[629.0,577.99],[630.0,578.0],[631.0,578.01],[631.25,578.04],[631.5,578.13],[631.75,578.34],[632.0,578.72],[632.25,579.17],[632.5,579.47],[632.75,579.42],[633.0,579.01],[633.25,578.33],[633.5,577.2],[633.75,575.0],[634.0,570.98],[634.25,565.16],[634.5,559.26],[634.75,556.12],[635.0,557.61],[635.25,562.97],[635.5,569.62],[635.75,575.36],[636.0,579.43],[636.25,582.02],[636.5,583.29],[636.75,583.28],[637.0,582.28],[637.25,580.84],[637.5,579.55],[637.75,578.69],[638.0,578.25],[638.25,578.07],[638.5,578.0],[638.75,577.98],[639.0,577.97],[639.25,577.95],[639.5,577.93],[640.5,577.75],[641.5,577.35],[642.5,576.68],[643.5,575.9],[644.5,575.43],[645.5,575.56],[646.5,576.2],[647.5,576.97],[648.5,577.55],[649.5,577.84],[650.5,577.96],[651.5,577.99],[652.5,578.0],[653.5,578.0],[654.5,578.0],[655.5,578.0],[656.5,578.0],[657.5,578.0],[658.5,578.0],[659.5,578.0]], X0 = 430.0, X1 = 660.0, GAP = 16;
    const yAt = x => { let i = 1; while (i < PTS.length - 1 && PTS[i][0] < x) i++; const [ax, ay] = PTS[i - 1], [bx, by] = PTS[i]; return ay + (by - ay) * Math.min(1, Math.max(0, (x - ax) / (bx - ax || 1))); };
    const seg = (a, b) => { const out = []; if (b <= a) return ''; out.push(a + ',' + yAt(a).toFixed(2)); for (const [x, y] of PTS) if (x > a && x < b) out.push(x + ',' + y); out.push(b + ',' + yAt(b).toFixed(2)); return out.join(' '); };
    const io2 = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    /* draw: entrance s < 1 traces the line from the left; once in, h (0..1) is the sweep head with a short blank gap ahead of it */
    function draw(mx, c) {
      const nw = $('.mx-new', mx), old = $('.mx-old', mx), head = $('.mx-head', mx);
      const hx = still ? X1 : X0 + (X1 - X0) * (c.s < 1 ? c.s : c.h);   // reduced motion: the full, still trace
      nw.setAttribute('points', seg(X0, hx));
      old.setAttribute('points', still || c.s < 1 ? '' : seg(Math.min(X1, hx + GAP), X1));
      const edge = Math.min(1, (hx - X0) / 18, (X1 - hx) / 18);
      head.setAttribute('opacity', (still || c.s <= 0 ? 0 : Math.max(0, edge)).toFixed(2));
      head.setAttribute('transform', 'translate(' + hx.toFixed(2) + ' ' + yAt(hx).toFixed(2) + ')');
    }
    /* one switch at v (0 off .. 1 on): knob glides across, track fades grey <-> turquoise, the off-state rim fades with it */
    function drawTg(t) {
      const v = t.v;
      t.kn.setAttribute('transform', 'translate(' + (10.2 * v).toFixed(2) + ' 0)');
      t.kn.setAttribute('stroke-opacity', (1 - v).toFixed(2));
      t.tr.setAttribute('fill', 'rgb(' + [Math.round(220 - 177 * v), Math.round(219 - 29 * v), Math.round(219 - 35 * v)] + ')');
    }
    /* runs on time, not scroll: traces in once the card is on screen, then loops; everything pauses while it's off screen */
    const vio = still || !window.gsap ? null : new IntersectionObserver(es => es.forEach(e => {
      const c = e.target._c; if (!c) return;
      c.vis = e.isIntersecting && e.intersectionRatio > .2;
      if (c.vis) c.begin();
      c.tl.forEach(t => t.paused(!c.vis));
    }), { threshold: [0, .2] });
    window.mxCtl = mx => {
      if (mx._c) return mx._c;
      const c = mx._c = { s: 1, h: 0, tl: [], vis: false, began: false };
      const tgs = $$('.mx-tg', mx).map(g => ({ g, kn: $('.mx-kn', g), tr: $('.mx-tr', g), home: +g.dataset.on, v: +g.dataset.on, busy: false }));
      /* random flips on a continuous loop: every 0.45-0.9s one switch (sometimes two, a beat apart) changes state; switches that have wandered
         from their original setting are more likely to be picked, so the panel drifts but never ends up all changed */
      const flip = (t, delay) => {
        t.busy = true;
        const tw = gsap.to(t, { v: t.v > .5 ? 0 : 1, duration: .4, delay, ease: 'power2.inOut', onUpdate: () => drawTg(t),
          onComplete: () => { t.busy = false; c.tl = c.tl.filter(x => x !== tw); } });
        c.tl.push(tw); if (!c.vis) tw.pause();
      };
      const pick = () => {
        const free = tgs.filter(t => !t.busy); if (!free.length || tgs.length - free.length >= 2) return null;   // never more than two moving
        const w = free.map(t => (Math.round(t.v) !== t.home ? 2.4 : 1)), sum = w.reduce((a, b) => a + b, 0);
        let r = Math.random() * sum; for (let i = 0; i < free.length; i++) if ((r -= w[i]) <= 0) return free[i];
        return free[free.length - 1];
      };
      const tick = () => {
        const a = pick(); if (a) flip(a, 0);
        if (Math.random() < .22) { const b = pick(); if (b) flip(b, .12 + Math.random() * .18); }
        const next = gsap.delayedCall(.45 + Math.random() * .45, () => { c.tl = c.tl.filter(x => x !== next); tick(); });
        c.tl.push(next); if (!c.vis) next.pause();
      };
      const d = () => draw(mx, c);
      c.begin = () => {
        if (c.began) return; c.began = true;
        const first = gsap.delayedCall(.3, () => { c.tl = c.tl.filter(x => x !== first); tick(); });               // secondary: random toggles, from the start
        c.tl.push(first);
        c.tl.push(gsap.to(c, { s: 1, duration: 1.6, ease: 'power1.out', onUpdate: d, onComplete: () => {
          c.h = 0;
          c.tl.push(gsap.to(c, { h: 1, duration: 3.6, ease: 'none', repeat: -1, onUpdate: d }));                    // primary: monitor sweep
          if (!c.vis) c.tl.forEach(t => t.pause());
        } }));
      };
      if (vio) { c.s = 0; d(); vio.observe(mx); }   // without motion (or GSAP) the markup's full still trace stays as is
      return c;
    };
    $$('.mx').forEach(window.mxCtl);
  })();

  /* ---------- Magrabi live UI: hearing-tech interface glows, scans and ripples; service cards rise in and take turns ---------- */
  (function magrabi() {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CARDS = [136, 328, 520, 712], ORG = '518 222';
    /* time-based: starts once the card is on screen, keeps looping, and pauses while it's off screen */
    const vio = still || !window.gsap ? null : new IntersectionObserver(es => es.forEach(e => {
      const c = e.target._c; if (!c) return;
      c.vis = e.isIntersecting && e.intersectionRatio > .2;
      if (c.vis) c.begin();
      c.tl.forEach(t => t.paused(!c.vis));
    }), { threshold: [0, .2] });
    window.mgCtl = mg => {
      if (mg._c) return mg._c;
      const c = mg._c = { tl: [], vis: false, began: false };
      const ga = $('.mg-glow-a', mg), gb = $('.mg-glow-b', mg), hud = $('.mg-hud', mg), rings = $$('.mg-ring', mg), arc = $('.mg-arc', mg);
      const cards = $$('.mg-card', mg), halos = $$('.mg-halo', mg), bar = $('.mg-bar', mg);
      c.begin = () => {
        if (c.began) return; c.began = true;
        const add = t => { c.tl.push(t); if (!c.vis) t.pause(); return t; };
        /* 1. hearing interface: soft radial reveal outward from the ear, then a gentle breathing glow */
        add(gsap.timeline()
          .fromTo(ga, { '--d': 0, opacity: .55 }, { '--d': 150, duration: 1.5, ease: 'power2.out' })
          .to(ga, { opacity: .16, duration: 1.2, ease: 'sine.inOut' }, '-=.5')
          .to(hud, { opacity: 1, duration: .8, ease: 'sine.out' }, .4)
          .add(() => add(gsap.to(ga, { opacity: .32, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }))));
        /* a thin scan band sweeps outward across the rings every few seconds */
        add(gsap.timeline({ repeat: -1, delay: 1.2, repeatDelay: 1.6 })
          .fromTo(gb, { '--r': 22, opacity: 0 }, { '--r': 140, duration: 1.9, ease: 'power1.inOut' })
          .to(gb, { opacity: .85, duration: .5, ease: 'sine.out' }, 0)
          .to(gb, { opacity: 0, duration: .6, ease: 'sine.in' }, 1.3));
        /* two thin rings expand from the ear and fade, staggered; a short arc pair turns slowly */
        rings.forEach((ring, i) => add(gsap.fromTo(ring, { scale: 1, opacity: .55, svgOrigin: ORG }, { scale: 3.2, opacity: 0, svgOrigin: ORG, duration: 2.8, ease: 'sine.out', repeat: -1, delay: .6 + i * 1.4 })));
        add(gsap.to(arc, { rotation: 360, svgOrigin: ORG, duration: 16, ease: 'none', repeat: -1 }));
        /* 2. service cards: staggered rise, then the active state steps across them */
        add(gsap.fromTo(cards, { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .12, delay: .25 }));
        gsap.set(bar, { opacity: 0, x: 0 });
        let k = -1;
        const step = () => {
          const prev = k; k = (k + 1) % CARDS.length;
          if (prev >= 0) { add(gsap.to(cards[prev], { y: 0, duration: .6, ease: 'power2.inOut' })); add(gsap.to(halos[prev], { opacity: 0, duration: .6, ease: 'sine.inOut' })); }
          add(gsap.to(cards[k], { y: -3, duration: .6, ease: 'power2.inOut' }));
          add(gsap.to(halos[k], { opacity: .07, duration: .6, ease: 'sine.inOut' }));
          add(gsap.to(bar, { x: CARDS[k] - CARDS[0], opacity: 1, duration: prev < 0 ? .5 : .7, ease: 'power2.inOut' }));
          add(gsap.delayedCall(1.9, step));
        };
        add(gsap.delayedCall(1.4, step));
      };
      if (vio) {
        gsap.set($$('.mg-card', mg), { opacity: 0 });   // hidden until the card rises in; without motion they stay as in the markup
        vio.observe(mg);
      }
      return c;
    };
    $$('.mg').forEach(window.mgCtl);
  })();

  /* ---------- Cold room HMI live UI (visual demo only): temperature drift, compressor activity; CSS runs the rest ---------- */
  (function coldroom() {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vio = still || !window.gsap ? null : new IntersectionObserver(es => es.forEach(e => {
      const c = e.target._c; if (!c) return;
      c.vis = e.isIntersecting && e.intersectionRatio > .15;
      e.target.classList.toggle('run', c.vis);          // fans, coil glows and pulses (CSS) run only while on screen
      if (c.vis) c.begin();
      c.tl.forEach(t => t.paused(!c.vis));
    }), { threshold: [0, .15] });
    window.crCtl = cr => {
      if (cr._c) return cr._c;
      const c = cr._c = { tl: [], vis: false, began: false, t: 23.18 };
      const txt = $('.cr-temp', cr), comps = $$('.cr-comp', cr);
      const add = t => { c.tl = c.tl.filter(x => x.progress() < 1); c.tl.push(t); if (!c.vis) t.pause(); return t; };   // drop finished ones as we go
      /* temperature: small, smooth moves inside 22.80-23.50, as a live reading would */
      const drift = () => {
        let next = c.t + (Math.random() < .5 ? -1 : 1) * (.04 + Math.random() * .2);
        if (next < 22.8 || next > 23.5) next = c.t - (next - c.t);
        next = Math.min(23.5, Math.max(22.8, next));
        add(gsap.to(c, { t: next, duration: 1.2 + Math.random() * .8, ease: 'sine.inOut', onUpdate: () => { txt.textContent = c.t.toFixed(2); } }));
        add(gsap.delayedCall(1.9 + Math.random() * 1.6, drift));
      };
      /* compressors: one, sometimes two, light up for a while at different intervals */
      const activity = () => {
        const n = Math.random() < .3 ? 2 : 1, pool = comps.slice().sort(() => Math.random() - .5).slice(0, n);
        pool.forEach((el, k) => {
          add(gsap.delayedCall(k * (.6 + Math.random() * .8), () => el.classList.add('on')));
          add(gsap.delayedCall(2.6 + Math.random() * 1.6 + k, () => el.classList.remove('on')));
        });
        add(gsap.delayedCall(3.2 + Math.random() * 2.2, activity));
      };
      c.begin = () => { if (c.began) return; c.began = true; add(gsap.delayedCall(.6, drift)); add(gsap.delayedCall(.3, activity)); };
      if (vio) vio.observe(cr);
      return c;
    };
    $$('.cr').forEach(window.crCtl);
  })();

  /* ---------- hero dot field ---------- */
  const heroState = { p: 0 };
  (function dotField() {
    const cv = $('#field'), ctx = cv.getContext('2d'), host = $('#hero');
    const GAP = 26, R = 170;
    let w = 0, h = 0, dots = [], visible = true, ink = '#5F635C', red = '#D3126C';
    const m = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
    function colors() { const s = getComputedStyle(root); ink = s.getPropertyValue('--muted').trim() || ink; red = s.getPropertyValue('--redline').trim() || red; }
    function size() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = []; for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push([x, y]);
      colors();
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const s = t / 1000, sp = heroState.p;
      const inkPath = new Path2D(), redPath = new Path2D();
      for (let i = 0; i < dots.length; i++) {
        let [x, y] = dots[i];
        const wave = Math.sin(x * .011 + s * 1.1) * Math.cos(y * .013 + s * .7);
        y += wave * 3 + sp * (y * .35);
        const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy);
        let r = .8 + wave * .35, hot = false;
        if (d < R) {
          const f = (1 - d / R) ** 2;
          x += dx / (d || 1) * f * 26; y += dy / (d || 1) * f * 26;
          r += f * 2.4; hot = f > .2;
        }
        const path = hot ? redPath : inkPath;
        path.moveTo(x + r, y); path.arc(x, y, Math.max(.3, r), 0, 6.283);
      }
      ctx.globalAlpha = .3; ctx.fillStyle = ink; ctx.fill(inkPath);
      ctx.globalAlpha = .7; ctx.fillStyle = red; ctx.fill(redPath);
    }
    function frame(t) {
      requestAnimationFrame(frame);
      if (!visible) return;
      if (m.tx < -9000 || m.x < -9000) { m.x = m.tx; m.y = m.ty; }
      else { m.x += (m.tx - m.x) * .12; m.y += (m.ty - m.y) * .12; }
      draw(t);
    }
    host.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); m.tx = e.clientX - r.left; m.ty = e.clientY - r.top; });
    host.addEventListener('pointerleave', () => { m.tx = m.ty = -1e4; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colors);
    new MutationObserver(colors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    size(); addEventListener('resize', size);
    if (reduce) draw(0); else requestAnimationFrame(frame);
  })();

  /* ---------- marquee reacting to scroll velocity ---------- */
  (function marquee() {
    if (reduce) return;
    const mq = $('#mq'), unit = $('.mq-inner', mq);
    let x = 0, dir = -1, W = unit.offsetWidth, skew = 0;
    addEventListener('resize', () => { W = unit.offsetWidth; });
    if (document.fonts) document.fonts.ready.then(() => { W = unit.offsetWidth; });
    const loop = () => {
      if (velocity > .1) dir = -1; else if (velocity < -.1) dir = 1;
      const speed = .6 + Math.min(Math.abs(velocity) * .5, 14);
      x += speed * dir; if (x <= -W) x += W; if (x > 0) x -= W;
      skew += ((Math.max(-8, Math.min(8, velocity * .35))) - skew) * .12;
      mq.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
      velocity *= .92;
    };
    if (hasGsap) gsap.ticker.add(loop); else { const r = () => { loop(); requestAnimationFrame(r); }; requestAnimationFrame(r); }
  })();

  /* ---------- word splitting ---------- */
  function splitWords(el) {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s = document.createElement('span'); s.className = 'w'; s.style.display = 'inline-block'; s.textContent = p; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el); return $$('.w', el);
  }

  /* ---------- case studies: full-screen view opened from each Selected work card ---------- */
  (function caseStudies() {
    /* Each case is a header (title, sub, meta) plus an ordered list of sections.
       A section has an eyebrow (k) and any of: lead, text[], chips[], users[[h, d|list]],
       steps[{h, d, label, list, cols, result, cap}], take[str|[h, d]], link, note. */
    const CASES = [
      {
        slug: 'leaseteq', title: 'LeaseTeq', sub: 'A multi-portal vehicle leasing platform for customers, dealers and operations teams across five European markets.',
        meta: [['Role', 'Product Designer'], ['Client', 'LeaseTeq'], ['Service', 'Vehicle leasing platform'], ['Year', '2026']],
        sections: [
          { k: 'Overview', lead: 'LeaseTeq connects customers, dealerships, financial partners and operations teams across the whole leasing lifecycle, in one platform.',
            text: ['It runs in Switzerland, Germany, France, Italy and Austria, and streamlines leasing, approval and contract management while letting every stakeholder work together.', 'As Product Designer I worked with the Product Owner and the engineering team to design all three portals: Customer, Dealer and Operations.'] },
          { k: 'The problem', text: ['Traditional leasing ran on disconnected systems, manual document handling, complex approval workflows and little visibility between stakeholders. That meant operational inefficiency, communication gaps and slow onboarding for customers and dealers.', 'The goal was to turn the process into a scalable digital ecosystem that supports several markets, stakeholders and business models, without losing a seamless experience.'] },
          { k: 'My role', chips: ['Product discovery workshops', 'User flows', 'Information architecture', 'Wireframing', 'UI design', 'Design system', 'Interaction design', 'Design QA', 'Engineering collaboration', 'Feature prioritization support', 'UX reviews of shipped features'] },
          { k: 'Who it serves', users: [
            ['Customers', ['Apply for vehicle leasing', 'Upload required documents', 'Track application progress']],
            ['Dealers', ['Create and manage applications', 'Monitor contract status', 'Manage commissions and incentives']],
            ['Operations teams', ['Review applications', 'Manage risk and approvals', 'Activate contracts', 'Monitor lifecycle events']]
          ] },
          { k: 'Key challenges', steps: [
            { h: 'Designing a multi-sided platform', d: 'Every stakeholder group had its own goals, workflows, permissions and responsibilities, yet all of their interactions had to stay connected across the leasing lifecycle.',
              label: 'What I did', list: ['Mapped stakeholder relationships', 'Defined cross-portal workflows', 'Standardized shared patterns', 'Unified status communication across portals', 'Created reusable interaction models'],
              result: 'Customers, dealers, operations teams and financial partners collaborate efficiently, each with workflows tailored to their needs.' },
            { h: 'Complex leasing journeys without scrolling', d: 'Most experiences had to fit a single viewport. The business wanted people to understand information at a glance, avoid long forms and finish applications with minimal friction.',
              label: 'What I did', list: ['Applied progressive disclosure', 'Split large workflows into focused steps', 'Prioritized essential information', 'Added contextual guidance', 'Optimized layouts for common laptop resolutions'],
              result: 'People complete applications covering personal, company, ownership, employment, income, expense and vehicle details through a structured, manageable flow.' },
            { h: 'Simplifying financial complexity', d: 'Residual values, special payments, interest rates, rebates, subsidies and commission structures are unfamiliar to many users.',
              label: 'What I did', list: ['Simplified terminology', 'Introduced contextual explanations', 'Designed real-time calculation feedback', 'Showed the monthly payment updating live'],
              result: 'Users see instantly how duration, mileage and special payments change the monthly cost, which builds confidence while configuring a lease.' },
            { h: 'A smarter eligibility experience', d: 'Qualification requirements created friction. The traditional approach ended in an outright rejection after the affordability check.',
              label: 'Recovery paths instead of dead ends', list: ['Add a partner’s income', 'Include household income', 'Increase the special payment'],
              result: 'Rejection became guidance: people see other ways to qualify instead of abandoning the application.' },
            { h: 'Three portals, one consistent experience', d: 'Each portal serves different users, but the ecosystem had to feel like one product.',
              label: 'Reusable patterns for', list: ['Status communication', 'Form structures', 'Tables', 'Modals', 'Notifications', 'Document management', 'Action hierarchies'],
              result: 'The platform scaled faster, with a consistent experience across the Customer, Dealer and Operations portals.' },
            { h: 'Redesigning contract operations', d: 'Operations users handle large contract volumes every day and need the most relevant information first. Early workflows ordered information by process rather than by operational priority, so I reorganised contract management around the decisions people make.',
              cols: [['Before activation', ['Contract status', 'History', 'Documents', 'Finance', 'Notes']], ['After activation', ['Contract status', 'Transactions', 'Finance', 'Documents']], ['Also added', ['Activity logs', 'Smart assignment flows', 'Reassignment workflows', 'Approval visibility', 'Status timelines']]],
              result: 'Teams reach critical information faster, with less navigation and smoother workflows.' },
            { h: 'Managing dynamic contract lifecycles', d: 'A contract can move through review, verification, approval, delivery, activation, ownership transfer, buyout, termination and completion. Its status had to be clear without overwhelming anyone.',
              label: 'Solution', list: ['Status timelines', 'Contextual banners', 'Action-based notifications', 'Lifecycle tracking components'],
              result: 'Every stakeholder sees the current status, the actions required and the milestones ahead.' }
          ] },
          { k: 'Design system', text: ['Consistency mattered more with every new country and portal, so I established reusable foundations for the whole platform.'],
            chips: ['Buttons', 'Forms', 'Tables', 'Modals', 'Status indicators', 'Banners', 'Navigation patterns', 'Responsive layouts', 'Typography scales'],
            result: 'The design system sped up feature delivery while keeping the product cohesive.' },
          { k: 'Working with engineering', chips: ['Reviewing implemented features', 'Identifying UX inconsistencies', 'Clarifying edge cases', 'Suggesting interaction improvements', 'Supporting responsive behaviour', 'Design quality checks before release'],
            result: 'Fewer implementation gaps and consistently high product quality.' },
          { k: 'Business impact', cls: 'cs-out', lead: 'LeaseTeq grew into a scalable leasing ecosystem serving customers, dealers, operations teams and financial partners across Europe.',
            take: ['Expanded into multiple markets and streamlined operational workflows', 'Established strategic partnerships with Tesla, Hyundai and BAWAG', 'Laid the foundation for future OEM and broker offerings', 'Improved visibility and efficiency across the leasing lifecycle'] },
          { k: 'What I learned', text: ['This project strengthened my ability to simplify complex systems involving many stakeholders, business requirements, operational processes and financial workflows.', 'It reinforced the importance of designing beyond individual screens: focusing on how people, systems and processes connect across the product, creating clarity within complexity, and building experiences that scale with the business.'] },
          { k: 'Takeaways', take: ['One of the most complex products I have worked on: three portals, several stakeholder groups and five European markets.', 'Great product design means understanding how people, systems and processes connect across an entire ecosystem, not just creating screens.', 'A shared design system is what made three portals and five markets manageable.'] },
          { k: 'More on request', note: 'Because of the project’s size and complexity, this case study covers only part of the work. I’m happy to walk you through more workflows, design decisions and product challenges.' }
        ]
      },
      {
        slug: 'shannon-trust', title: 'Shannon Trust: Turning Pages', sub: 'An accessible reading platform for prison learners, redesigned around calm, guided and audio-first interactions.',
        meta: [['Role', 'UX/UI Designer'], ['Client', 'Shannon Trust · Turning Pages'], ['Service', 'Accessibility platform'], ['Year', '2023']],
        sections: [
          { k: 'Overview', lead: 'Shannon Trust built Turning Pages to help prison learners improve their literacy through guided learning.',
            text: ['It is designed for people with low literacy and little digital experience, and serves three groups: learners, facilitators and coaches. It has to be emotionally considerate, accessible and easy to navigate in a highly constrained prison learning environment.', 'My work improved the overall experience and visual design: simplifying interactions, reducing cognitive load and aligning the interface with learners’ needs, based on feedback from facilitators and coaches.'] },
          { k: 'My role', chips: ['UX/UI design', 'Accessibility-focused product design', 'Responsive design', 'User testing collaboration', 'Design iteration and experience enhancement'],
            text: ['I worked closely with project managers and developers to turn existing journeys into more accessible, intuitive experiences, driven by facilitator and coach feedback and within tight time and delivery constraints.'] },
          { k: 'The challenge', text: ['Designing for prison learners raised accessibility and emotional challenges well beyond typical educational UX. Usability testing with learners wasn’t possible because of prison restrictions, so all feedback came indirectly through facilitators and coaches.'],
            groups: [['Learners', ['Had very different literacy levels', 'Were unfamiliar with digital products', 'Needed simplified interaction patterns', 'Rejected colourful or playful interfaces', 'Reacted badly to childlike illustration and messaging']], ['The design had to balance', ['Accessibility', 'Emotional sensitivity', 'Usability', 'Technical limitations', 'Delivery timelines', 'Stakeholder constraints']]],
            after: 'The goal: an experience that feels supportive, clear and engaging.' },
          { k: 'Key decisions', steps: [
            { h: 'One split voice-action button', d: 'The main goal was to reduce cognitive friction. The original design used two separate buttons: one to perform an action, another to hear its label read aloud, which confused people with limited reading ability. I merged them into a single split button: the left side plays the audio, the right side performs the action.',
              result: 'Less cognitive overhead, with audio support intact.', cap: 'Two actions turned into one accessibility-first pattern.' },
            { h: 'Guided learning journeys', d: 'Learners needed to know where they were, what they had finished and what came next. Exercises changed from isolated screens into a guided, step-by-step journey with clear progression, giving motivation and structure without heavy gamification or distracting visuals.' },
            { h: 'Visual restraint as a UX decision', d: 'Facilitators and coaches told us learners strongly rejected childish or playful interfaces: bright colours, decorative illustration and celebratory messages caused discomfort and disengagement.',
              label: 'Design shifts', list: ['Calmer visual hierarchy', 'Simplified layouts', 'Icon-based communication', 'Restrained colour', 'Minimal illustration', 'Clearer typography and spacing'],
              more: 'Microcopy changed too: celebratory lines like “Hooray! You did it!” became neutral, respectful language.',
              result: 'A supportive, dignified experience rather than a patronising one.' },
            { h: 'Supporting facilitators and coaches', d: 'Staff needed help getting started. I designed a step-by-step onboarding flow that introduces the platform’s key features, with guidance always available from the profile area.',
              result: 'Less reliance on outside support and more confident navigation.', cap: 'Key features introduced through a structured onboarding journey.' }
          ] },
          { k: 'Real-world constraints', take: ['Limited access to end users', 'Indirect research through facilitators and coaches', 'Accessibility requirements', 'Emotional sensitivity', 'Strict timelines and delivery expectations', 'Development feasibility and cost'],
            after: 'Rather than chasing ideal solutions, I prioritised the improvements with the biggest usability impact within scope.' },
          { k: 'Outcome', cls: 'cs-out', lead: 'A more accessible, emotionally considerate learning environment for prison learners with low literacy and limited digital experience.',
            text: ['Simpler interactions and fewer visual distractions made the platform easier to navigate. Learning flows became clearer guided journeys, audio support stayed in place for learners who rely on it, and facilitators and coaches got supportive onboarding and clearer guidance.', 'All of this was achieved despite limited learner access, strict content sensitivity and tight timelines, by translating facilitator feedback into changes that balanced accessibility, emotional sensitivity and practical implementation.'] },
          { k: 'Takeaways', take: ['Indirect research can still be rigorous when you listen closely to the people who work with users every day.', 'For this audience, restraint and respect mattered more than delight.', 'Within real constraints, focus on the changes with the biggest usability impact.'] }
        ]
      },
      {
        slug: 'abacus', title: 'Abacus Mobile App', sub: 'A gamified mental math app for children aged 3 to 15 that connects families with trainers and math centres.',
        meta: [['Role', 'Product Designer'], ['Industry', 'EdTech'], ['Year', '2023'], ['Platform', 'Mobile app']],
        sections: [
          { k: 'Overview', lead: 'Abacus teaches children aged 3 to 15 mental math through interactive, gamified lessons.',
            text: ['It builds early math skills and connects students with qualified trainers and mental math centres, making the Abacus method easier and more affordable to reach.'] },
          { k: 'Goals', chips: ['Teach foundational math basics', 'Gamify learning for fun', 'Build complex math skills', 'Partner with math centres'] },
          { k: 'The problem', text: ['Children had limited access to engaging mental math resources, and private tutoring was expensive, especially for families with several children. The app needed to connect families with qualified tutors and offer lower-cost options.'] },
          { k: 'Objectives', users: [
            ['Foundation skills', 'Teach basic math with the abacus in a fun, creative way.'],
            ['Special needs support', 'Help children with autism, mainly aged 3 to 7, build math skills.'],
            ['Competitive edge', 'Challenge gifted students and prepare them for global competitions.'],
            ['Affordability', 'Cut the cost of traditional math education for families with several children.'],
            ['Training opportunities', 'Let fresh graduates become trainers, with materials and support provided.'],
            ['Partnerships', 'Work with math centres to track student progress across learning modes.'],
            ['Awareness', 'Grow awareness and use of the Abacus method in Palestine and the wider region.']
          ] },
          { k: 'Research and insights', steps: [
            { h: 'Meetings and surveys', d: 'Several meetings with the CEO shaped the app’s direction, and a parent survey captured preferences, challenges and attitudes toward math education.' },
            { h: 'Target audience', d: 'Parents aged 25 to 45 in Palestine and Saudi Arabia with children aged 3 to 15, especially gifted children and those who struggle with math.' },
            { h: 'Market research', d: 'An analysis of mobile and educational app usage in the target regions, plus a competitor review of leading education apps: their features, downloads and engagement.' },
            { h: 'Card sorting to define the MVP', d: 'A full set of brainstorming cards was sorted and prioritised by user needs, from mental math fundamentals to tutor connections.',
              label: 'The MVP', list: ['Interactive learning modules', 'Gamification', 'Progress tracking', 'Online tutoring', 'Parental controls and monitoring'] }
          ] },
          { k: 'Design process', steps: [
            { h: 'Sketches to wireframes', d: 'Sketches came first, then wireframes for the core flows.',
              label: 'Core screens', list: ['Home: simple navigation for children and parents', 'Learning modules: organised by grade and ability', 'Gamified challenges: competition with peers', 'Trainer booking: parents book sessions with qualified trainers'] },
            { h: 'High-fidelity prototypes', d: 'Interactive prototypes simulated the full experience so the team could test the flows end to end before build.' }
          ] },
          { k: 'Features', users: [
            ['Interactive learning modules', 'Lessons on addition, subtraction, multiplication and division.'],
            ['Gamification', 'Math challenges and competitions with peers.'],
            ['Progress tracking', 'Tools for parents to follow their child’s learning.'],
            ['Flexible levels', 'Learning paths adjusted to each child’s experience and skill.'],
            ['Online tutoring', 'Personalised sessions with certified trainers.']
          ] },
          { k: 'Outcome', cls: 'cs-out', lead: 'Children engaged more with math through a platform that is enjoyable and easy to use, with better retention and stronger skills.',
            text: ['Parents can follow their child’s progress, and the gamified structure keeps children motivated. Partnerships with education centres extended learning to underserved communities, and the project created jobs for fresh graduates while supporting math education across the region.'] },
          { k: 'Takeaways', take: ['Gamification works best when it supports real skill-building.', 'Card sorting kept a big wish list down to a focused MVP.', 'Designing for parents and children means two audiences on one screen.'] }
        ]
      },
      {
        slug: 'monmedx', title: 'MonMedX', sub: 'Improvement sprints for a remote healthcare SaaS platform that now serves 250 clinics across Canada.',
        meta: [['Role', 'Product Designer'], ['Client', 'Bitlab'], ['Service', 'Healthcare SaaS'], ['Year', '2022']],
        sections: [
          { k: 'Overview', lead: 'MonMedX is a remote healthcare platform for clinic operations, patient management and medical workflows across many facilities.',
            text: ['After its initial launch, I joined during the improvement sprints to refine the UI and keep the design system consistent: streamlining features, updating components and designing new functionality to meet client requirements.'] },
          { k: 'Deliverables', chips: ['UX design', 'UI design', 'Webflow', 'SEO'] },
          { k: 'The challenge', text: ['The platform was already live, so the work started by finding pain points. User feedback surfaced usability problems as the product scaled to more clinics, and every change had to fit the existing design system while flexing to different medical specialties.'] },
          { k: 'My role', chips: ['Discovery and requirements with the CTO', 'Design system extension', 'High-fidelity UI and prototypes', 'Internal user testing', 'Agile collaboration in Jira', 'Developer handoff and documentation'] },
          { k: 'Process', steps: [
            { h: 'Discovery and requirements', d: 'User feedback on scaling issues guided which features to prioritise. I worked with the CTO, who turned client meetings into user stories that framed each improvement.' },
            { h: 'A scalable design system', d: 'Updates followed the existing colours, type, UI elements and components. Because clinics had different needs, I designed flexible components that adapt to each specialty while keeping one unified look and feel.' },
            { h: 'UI design and prototyping', d: 'High-fidelity prototypes for new features, including better navigation, clinic management tools and patient interaction, built for intuitive, consistent navigation for administrators and patients.',
              label: 'Key screens', list: ['Clinic dashboard', 'Appointment scheduling', 'Patient profiles'] },
            { h: 'User testing and feedback', d: 'Internal testing with stakeholders, with client feedback folded in.',
              label: 'Tasks tested', list: ['Scheduling appointments', 'Navigating the clinic dashboard', 'Updating patient records'],
              result: 'A simpler interface, more readable clinic-specific data and faster patient record updates.' },
            { h: 'Collaboration and iteration', d: 'I worked in an agile team with developers, used Jira for tasks, progress and user stories, and joined daily stand-ups with the CTO on design progress and client requirements.' },
            { h: 'Implementation and handoff', d: 'Final UI assets went to the development team with every component documented in the design system for future scale. The improved platform then launched to more clinics and a wider range of healthcare providers.' }
          ] },
          { k: 'Outcome', cls: 'cs-out', lead: 'The platform scaled to 250 clinics across Canada and a wide range of specialties.',
            text: ['Consistent design and scalable components streamlined clinic management and improved the experience, which led to higher client satisfaction and better adoption. The updates met immediate needs and set the foundation for growth as more clinics joined.'],
            link: ['Visit monmedx.com', 'https://monmedx.com'] },
          { k: 'Takeaways', take: [['Scalability is crucial', 'Refining the design system and building adaptable components kept things consistent while the platform grew with the number of clinics.'], ['Collaboration is key', 'Regular contact with stakeholders, the CTO, developers and clients kept the project on track.'], ['Agility improves results', 'Working iteratively let the design evolve with real-time feedback.']] }
        ]
      },
      {
        slug: 'magrabi', title: 'Magrabi Hospitals & Centers', sub: 'An accessible website redesign for a network of 32 hospitals and centres across the Middle East and Africa.',
        meta: [['Role', 'Product Designer'], ['Client', 'Dash Company'], ['Service', 'Healthcare website'], ['Year', '2023']],
        sections: [
          { k: 'Overview', lead: 'Magrabi, a leading medical network with 32 hospitals and centres across the Middle East and Africa, wanted a stronger digital presence through a user-centred redesign.',
            text: ['The new website had to make it simple to navigate, understand services and book appointments across Eye, ENT and Dentistry, and be accessible to a very diverse group of patients.'] },
          { k: 'Deliverables', chips: ['Enhanced accessibility features', 'Streamlined navigation', 'Simpler appointment booking', 'Improved visual hierarchy'] },
          { k: 'Discovery and research', steps: [
            { h: 'Client meetings', d: 'I met the Magrabi team to understand their goals, earlier user feedback and the problems with the old site. They stressed better accessibility, especially for patients with vision impairments.' },
            { h: 'Competitive analysis', d: 'A review of healthcare websites and industry standards: how competitors handle accessibility, information hierarchy and appointment booking.',
              label: 'Common features found', list: ['Font size adjustment', 'Screen readers', 'Brightness controls'] }
          ] },
          { k: '19 user interviews', users: [['Eye Care', '5 patients and 3 family members'], ['ENT', '3 patients and 2 family members'], ['Dentistry', '3 patients and 3 family members']],
            take: ['Patients with vision impairments found the old site hard to navigate.', 'Family members needed quick access to booking and service details.'] },
          { k: 'Key insights', users: [['Accessibility needs', 'Patients with vision impairments needed better readability and usability.'], ['Easier navigation', 'A more intuitive layout for finding services, locations and booking.'], ['Clear visual hierarchy', 'Important sections and actions had to be easy to spot.']] },
          { k: 'Accessibility toolkit', steps: [
            { h: 'Screen reader', d: 'Audio navigation for visually impaired users.' },
            { h: 'Font size control', d: 'Text size that each user can adjust.' },
            { h: 'Brightness control', d: 'Adjustable screen brightness to reduce strain and improve visibility in different lighting.' },
            { h: 'Line height adjustment', d: 'More line spacing for clearer, easier reading.' },
            { h: 'Highlighted sections', d: 'Highlights that make essential information easy to find.' }
          ] },
          { k: 'Wireframes and prototypes', steps: [
            { h: 'Wireframing', d: 'Wireframes mapped each page’s structure around simpler navigation, clear hierarchy and appointment booking reachable from several points on every page.' },
            { h: 'Low-fidelity prototypes', d: 'Figma prototypes tested layout and navigation flow, with the accessibility features built in so stakeholders could preview the changes early.' }
          ] },
          { k: 'Testing and iteration', text: ['Patients and family members tested the Figma prototypes, evaluating every accessibility feature: screen reader, font and brightness controls, line height and section highlights.'],
            label: 'What changed', take: ['The screen reader toggle became more visible', 'Brightness changes transition more smoothly', 'Section highlights were repositioned so essential information stands out'] },
          { k: 'Final design and handoff', steps: [
            { h: 'Finalised design', d: 'A clean, user-friendly interface with intuitive accessibility controls, and redesigned key pages (service descriptions, appointment booking and contact information) for seamless navigation.' },
            { h: 'Handoff to development', d: 'Each accessibility feature was documented with specifications for developers, then tested in the final product for consistency across devices and browsers.' }
          ] },
          { k: 'Outcome', cls: 'cs-out', lead: 'A modern, user-friendly website that puts accessibility and patient engagement first.',
            text: ['Adjustable font sizes, screen reader support and brightness settings, together with intuitive navigation and a clearer hierarchy, make vital information easier to reach for patients and their families.'] },
          { k: 'Takeaways', take: ['Accessibility belongs in the core experience, not hidden in settings.', 'Families are users too: design for the person booking, not only the patient.', 'Small refinements from testing made the accessibility tools actually usable.'] }
        ]
      },
      {
        slug: 'boka', title: 'Boka', sub: 'Customer and provider apps for a beauty and wellness booking marketplace.',
        meta: [['Role', 'Product Designer'], ['Client', 'Bitlab'], ['Service', 'Beauty and wellness'], ['Year', '2022']],
        sections: [
          { k: 'Overview', lead: 'Boka connects customers with beauty and wellness providers. I redesigned its customer and provider mobile apps.',
            text: ['The work tackled time management, service add-ons and scheduling for freelance providers, refining the booking system and making appointment scheduling faster for everyone. I also worked with another designer on the customer desktop UI and gave usability feedback.'] },
          { k: 'Deliverables', chips: ['Product design', 'UX strategy', 'Brand integration', 'Interactive prototypes'] },
          { k: 'Research and requirements', text: ['I reviewed feedback from customers and providers, then met the CTO and the client to clarify requirements and pain points. The booking had to feel effortless for customers and efficient for providers managing their day.'],
            label: 'Key challenges', take: ['Inefficient booking time slots', 'Services that can run at the same time', 'Add-ons that change price or duration', 'Travel time for freelance providers'] },
          { k: 'User needs', users: [['Customers', 'Fast, straightforward booking with minimal friction when choosing services.'], ['Service providers', 'Efficient time management, offering several services and tracking travel time.']],
            after: 'Together with the team I prioritised features against these needs and the business goals, then wireframed the booking flow, time slot management and provider controls for both apps.' },
          { k: 'Design solutions', steps: [
            { h: 'Less wasted provider time', d: 'Bookings run in 15-minute increments. When a service is shorter than its slot, the system suggests adjacent slots so a provider’s day has fewer gaps.' },
            { h: 'Add-on management', d: 'Providers list add-ons as paid or time-dependent. If a chosen slot can’t fit the add-ons, the app alerts the customer so they can pick another time.' },
            { h: 'Simultaneous services', d: 'Providers can mark services that run at the same time, so the app still shows real availability even when they are technically booked.' },
            { h: 'Travel time for freelancers', d: 'Travel time is built into booking: available slots reflect a provider’s existing appointments and the time it takes to get between them.' }
          ] },
          { k: 'Collaboration and handoff', text: ['I worked closely with the development team in Jira, documented every design asset and specification, ran the final handoff and supported implementation to protect the integrity of the design.'] },
          { k: 'Outcome', cls: 'cs-out', lead: 'Booking became faster and simpler for customers and more efficient for providers.',
            text: ['Optimised time slots, add-ons and travel time meant fewer scheduling conflicts, better use of providers’ time, fewer booking errors and higher customer satisfaction, and set the stage for future features and growth.'],
            link: ['View Boka for Business on the App Store', 'https://apps.apple.com/us/app/boka-for-business/id1629895082'] },
          { k: 'Takeaways', take: [['Efficiency is key', 'Balance simplicity with advanced functionality: cut friction while maximising efficiency.'], ['Scalability matters', 'The booking flow and UI had to adapt to new services and more providers.'], ['Collaboration drives success', 'Close contact with the client, project manager and developers kept requirements and priorities aligned.']] }
        ]
      },
      {
        slug: 'cold-room', title: '1S1S / 2W1S Cold Room Control System', sub: 'An industrial control interface for monitoring and managing cold room temperatures, compressors, cooling systems, and operating conditions.',
        meta: [['Category', 'Industrial control system'], ['Discipline', 'HMI, UX/UI design']],
        sections: [
          { k: 'Overview', lead: 'An industrial control interface for monitoring and managing cold room temperatures, compressors, cooling systems, and operating conditions.' }
        ]
      }
    ];

    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cs = $('#cs'), body = $('#csBody'), bar = $('#csBar'), closeBtn = $('#csClose'), countEl = $('#csCount');
    if (!cs) return;
    const cards = $$('.case');
    const links = $$('.case-link');
    links.forEach((a, i) => {
      if (!CASES[i]) return;
      a.href = '#case/' + CASES[i].slug;
      a.removeAttribute('target'); a.removeAttribute('rel');
      a.setAttribute('aria-label', CASES[i].title + ' case study');
    });

    let openIdx = -1, lastFocus = null, io = null;
    const lock = on => { root.style.overflow = on ? 'hidden' : ''; if (lenis) on ? lenis.stop() : lenis.start(); };

    const mini = arr => `<ul class="cs-mini">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    const lab = t => `<p class="cs-label mono">${esc(t)}</p>`;
    function step(s, k) {
      return `<li class="cs-rv"><span class="mono">${String(k + 1).padStart(2, '0')}</span><h3>${esc(s.h)}</h3><div class="cs-sb">`
        + (s.d ? `<p>${esc(s.d)}</p>` : '')
        + (s.list ? (s.label ? lab(s.label) : '') + mini(s.list) : '')
        + (s.cols ? `<div class="cs-cols">${s.cols.map(([h, l]) => `<div>${lab(h)}${mini(l)}</div>`).join('')}</div>` : '')
        + (s.more ? `<p>${esc(s.more)}</p>` : '')
        + (s.result ? `<p class="cs-res"><span class="mono">Result</span>${esc(s.result)}</p>` : '')
        + (s.cap ? `<p class="cs-cap mono">${esc(s.cap)}</p>` : '')
        + `</div></li>`;
    }
    function sec(s) {
      const take = s.take ? (s.label ? lab(s.label) : '') + `<ul class="cs-take">${s.take.map(t => Array.isArray(t) ? `<li class="cs-rv"><strong>${esc(t[0])}.</strong> ${esc(t[1])}</li>` : `<li class="cs-rv">${esc(t)}</li>`).join('')}</ul>` : '';
      return `<section class="cs-sec wrap ${s.cls || ''}"><p class="eyebrow mono">${esc(s.k)}</p><div class="cs-c">`
        + (s.lead ? `<p class="cs-lead cs-rv">${esc(s.lead)}</p>` : '')
        + (s.text ? s.text.map(t => `<p class="cs-text cs-rv">${esc(t)}</p>`).join('') : '')
        + (s.groups ? `<div class="cs-cols cs-rv">${s.groups.map(([h, l]) => `<div>${lab(h)}${mini(l)}</div>`).join('')}</div>` : '')
        + (s.chips ? `<ul class="cs-chips mono cs-rv">${s.chips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '')
        + (s.users ? `<ul class="cs-users">${s.users.map(([h, v]) => `<li class="cs-rv"><strong>${esc(h)}</strong>${Array.isArray(v) ? mini(v) : `<span>${esc(v)}</span>`}</li>`).join('')}</ul>` : '')
        + take
        + (s.steps ? `<ol class="cs-steps">${s.steps.map(step).join('')}</ol>` : '')
        + (s.after ? `<p class="cs-text cs-rv">${esc(s.after)}</p>` : '')
        + (s.result ? `<p class="cs-res cs-rv"><span class="mono">Result</span>${esc(s.result)}</p>` : '')
        + (s.link ? `<a class="cs-ext mono cs-rv" href="${s.link[1]}" target="_blank" rel="noopener">${esc(s.link[0])} ↗</a>` : '')
        + (s.note ? `<div class="cs-note cs-rv"><p>${esc(s.note)}</p></div>` : '')
        + `</div></section>`;
    }

    function render(i) {
      const c = CASES[i], n = CASES[(i + 1) % CASES.length];
      const vis = cards[i] && $('.case-vis', cards[i]);
      body.innerHTML = `
        <header class="cs-hero wrap">
          <p class="eyebrow mono cs-rv">Case study · ${String(i + 1).padStart(2, '0')}</p>
          <h1 class="cs-title cs-rv" id="csTitle">${esc(c.title)}</h1>
          <p class="cs-sub cs-rv">${esc(c.sub)}</p>
          <dl class="cs-meta mono cs-rv">${c.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        </header>
        <div class="cs-visual wrap cs-rv"></div>
        ${c.sections.map(sec).join('')}
        <footer class="cs-next wrap">
          <p class="eyebrow mono">Next case</p>
          <a class="cs-next-link" href="#case/${n.slug}"><span class="cs-next-title">${esc(n.title)}</span><span class="cs-next-arrow" aria-hidden="true">→</span></a>
          <button type="button" class="cs-back mono" data-cs-close>← Back to all work</button>
        </footer>`;
      if (vis) {
        const v = vis.cloneNode(true);
        v.querySelectorAll('.dim').forEach(d => d.remove());
        v.removeAttribute('style'); v.querySelectorAll('[style]').forEach(el => { if (el.classList.contains('mock')) el.removeAttribute('style'); });
        $('.cs-visual', body).appendChild(v);
        v.querySelectorAll('.lt').forEach(l => window.ltWatch && window.ltWatch(l));
        v.querySelectorAll('.st').forEach(s => { s._c = null; if (window.stCtl) stCtl(s); });
        v.querySelectorAll('.ab').forEach(a => { a._c = null; if (window.abCtl) { const c = abCtl(a); c.set(1); } });
        v.querySelectorAll('.mx').forEach(m => { m._c = null; if (window.mxCtl) mxCtl(m); });
        v.querySelectorAll('.cr').forEach(m => { m._c = null; m.classList.remove('run'); m.querySelectorAll('.cr-comp').forEach(g => g.classList.remove('on')); if (window.crCtl) crCtl(m); });
        v.querySelectorAll('.mg').forEach(m => { m._c = null; m.querySelectorAll('[style]').forEach(el => el.removeAttribute('style')); m.querySelectorAll('.mg-card,.mg-ring,.mg-arc,.mg-halo,.mg-bar,.mg-hud').forEach(el => el.removeAttribute('transform')); if (window.mgCtl) mgCtl(m); });
      }
      countEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(CASES.length).padStart(2, '0');
      $$('[data-cs-close]', body).forEach(b => b.addEventListener('click', () => closeCase(true)));
      cs.scrollTop = 0;
      if (io) io.disconnect();
      const items = $$('.cs-rv', body);
      if (reduce || !('IntersectionObserver' in window)) items.forEach(el => el.classList.add('in'));
      else {
        io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: cs, rootMargin: '0px 0px -8% 0px' });
        items.forEach(el => io.observe(el));
      }
    }

    function openCase(i) {
      if (i < 0 || i >= CASES.length) return;
      const wasOpen = openIdx >= 0;
      openIdx = i;
      if (!wasOpen) lastFocus = document.activeElement;
      render(i);
      cs.hidden = false; lock(true);
      requestAnimationFrame(() => requestAnimationFrame(() => cs.classList.add('open')));
      setTimeout(() => closeBtn.focus({ preventScroll: true }), wasOpen ? 0 : 450);
      document.title = CASES[i].title + ' · Adnan Afana';
    }
    function closeCase(fromUi) {
      if (openIdx < 0) return;
      const i = openIdx; openIdx = -1;
      cs.classList.remove('open');
      setTimeout(() => { if (openIdx < 0) { cs.hidden = true; body.innerHTML = ''; } }, reduce ? 0 : 700);
      lock(false);
      document.title = 'Adnan Afana Portfolio';
      if (fromUi && location.hash.startsWith('#case/')) history.replaceState(null, '', location.pathname + location.search);
      const back = (cards[i] && $('.case-link', cards[i])) || lastFocus;
      if (back && back.focus) back.focus({ preventScroll: true });
    }
    const fromHash = () => {
      const m = location.hash.match(/^#case\/([\w-]+)/);
      const i = m ? CASES.findIndex(c => c.slug === m[1]) : -1;
      if (i >= 0) openCase(i); else closeCase(false);
    };
    addEventListener('hashchange', fromHash);
    closeBtn.addEventListener('click', () => closeCase(true));
    addEventListener('keydown', e => { if (e.key === 'Escape' && openIdx >= 0) closeCase(true); });
    cs.addEventListener('scroll', () => { const max = cs.scrollHeight - cs.clientHeight; bar.style.transform = `scaleX(${max > 0 ? cs.scrollTop / max : 0})`; }, { passive: true });
    if (location.hash.startsWith('#case/')) fromHash();
  })();

  /* ---------- no GSAP or reduced motion: page stays fully static ---------- */
  if (!hasGsap || reduce) { const L = $('#loader'); if (L) L.remove(); return; }

  /* ---------- hero prep + loader ---------- */
  gsap.set('.hero .li', { yPercent: 112, rotate: 2.5 });
  gsap.set('.hero [data-fade]', { autoAlpha: 0, y: 18 });
  gsap.set('#nav', { autoAlpha: 0, y: -20 });
  if (lenis) lenis.stop();

  function heroIn() {
    if (lenis) lenis.start();
    gsap.timeline()
      .to('.hero .li', { yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: .09 })
      .to('#nav', { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' }, .1)
      .to('.hero [data-fade]', { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .07 }, .35);
  }

  (function runLoader() {
    const L = $('#loader'), count = $('#lc'), bar = $('#lb'), stepEl = $('#ls');
    const steps = [[0, 'Loading type'], [30, 'Placing the grid'], [62, 'Measuring spacing'], [94, 'Ready']];
    const state = { v: 0 };
    const paint = () => {
      const v = Math.round(state.v);
      count.textContent = String(v).padStart(3, '0');
      bar.style.transform = `scaleX(${v / 100})`;
      for (let i = steps.length - 1; i >= 0; i--) if (v >= steps[i][0]) { if (stepEl.textContent !== steps[i][1]) stepEl.textContent = steps[i][1]; break; }
    };
    const loaded = new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true }));
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const minTime = new Promise(r => setTimeout(r, 1500));
    gsap.to(state, { v: 86, duration: 1.5, ease: 'power2.out', onUpdate: paint });
    Promise.race([Promise.all([loaded, fonts, minTime]), new Promise(r => setTimeout(r, 4000))]).then(() => {
      gsap.to(state, { v: 100, duration: .5, ease: 'power2.inOut', onUpdate: paint, onComplete: exit });
    });
    function exit() {
      gsap.timeline({ onComplete: () => { L.remove(); ScrollTrigger.refresh(); } })
        .to('.loader-inner', { autoAlpha: 0, filter: 'blur(12px)', y: -14, duration: .55, ease: 'power2.in' })
        .to('.slats i', { scaleY: 0, duration: 1.05, ease: 'expo.inOut', stagger: { each: .045, from: 'center' } }, '-=.2')
        .add(heroIn, '-=.75');
    }
  })();

  /* ---------- hero scroll-out ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => heroState.p = s.progress } })
    .to('.hero .line', { yPercent: i => -18 * (i + 1), ease: 'none' }, 0)
    .to('.hero-foot', { y: -40, opacity: .3, ease: 'none' }, 0);

  /* ---------- nav hides on scroll down ---------- */
  const nav = $('#nav');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > 240) });

  /* ---------- statement: scrubbed blur-to-sharp word reveal ---------- */
  const words = splitWords($('#statement'));
  gsap.fromTo(words, { opacity: .18, filter: 'blur(8px)', yPercent: 28 }, {
    opacity: 1, filter: 'blur(0px)', yPercent: 0, ease: 'none', stagger: .05,
    scrollTrigger: { trigger: '#statement', start: 'top 82%', end: 'bottom 55%', scrub: .8 }
  });
  gsap.from('.facts li', { y: 28, opacity: .2, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.facts', start: 'top 85%' } });

  /* ---------- redline measurements draw in ---------- */
  $$('[data-rl]').forEach(el => gsap.from(el, { scaleY: 0, duration: 1.1, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%' } }));

  /* ---------- section headings ---------- */
  $$('[data-words]').forEach(h => {
    const w = splitWords(h);
    gsap.from(w, { yPercent: 60, opacity: .15, filter: 'blur(6px)', duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 86%' } });
  });
  const cw = splitWords($('#contactTitle'));
  gsap.fromTo(cw, { opacity: .15, yPercent: 40 }, { opacity: 1, yPercent: 0, ease: 'none', stagger: .06, scrollTrigger: { trigger: '#contactTitle', start: 'top 85%', end: 'bottom 60%', scrub: .8 } });

  /* ---------- work: pinned horizontal gallery on desktop ---------- */
  const mm = gsap.matchMedia();
  const cards = $$('.case'), workCount = $('#workCount b');
  ScrollTrigger.addEventListener('refreshInit', fitWork);
  mm.add('(min-width: 900px) and (min-height: 560px)', () => {
    const track = $('#track'), work = $('#work');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    /* pin once the whole section is on screen; if a very short screen can't hold it, pin when its bottom (the card text) arrives */
    const pinAt = () => work.offsetHeight > innerHeight + 1 ? 'bottom bottom' : 'top top';
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#work', start: pinAt, end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: s => { if (workCount) workCount.textContent = String(Math.min(cards.length, Math.round(s.progress * (cards.length - 1)) + 1)).padStart(2, '0'); }
      }
    });
    cards.forEach((card, i) => {
      const vis = $('.case-vis', card), mock = $('.mock', card), lt = $('.lt', card);
      /* the first card is already in place when the gallery pins, so its reveal plays as the section slides in */
      const reveal = () => i === 0
        ? { trigger: card, start: 'top 85%', end: 'top 50%', scrub: true }
        : { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 40%', scrub: true };
      gsap.fromTo(vis, { clipPath: 'inset(9% 7% 9% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: reveal() });
      if (lt && window.ltGauge) {  /* LeaseTeq gauge rides the same reveal: arc, dot and count move with the card */
        const g = { p: 0 }; lt.classList.add('gs'); ltCtl(lt).set(0);
        gsap.fromTo(g, { p: 0 }, { p: 1, ease: 'none', scrollTrigger: reveal(), onUpdate: () => ltCtl(lt).set(g.p) });
      }
      const ab = $('.ab', card);
      if (ab && window.abCtl) {  /* Abacus: the bead sequence plays as the card is revealed, then it loops */
        const g = { p: 0 }, c = abCtl(ab); c.set(0);
        const from = () => Math.min(100, (card.getBoundingClientRect().left - gsap.getProperty(track, 'x')) / innerWidth * 100 - .5);
        const run = () => i === 0 ? reveal() : { trigger: card, containerAnimation: tween, start: () => 'left ' + from() + '%', end: () => 'left ' + Math.min(40, from() - 25) + '%', scrub: true };
        gsap.fromTo(g, { p: 0 }, { p: 1, ease: 'none', scrollTrigger: run(), onUpdate: () => c.set(g.p) });
      }
      gsap.fromTo(mock, { xPercent: 5 }, { xPercent: -5, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    const ltRows = $('.case .lt-rows'), ltThumb = $('.case .lt-thumb');
    if (ltRows) gsap.timeline({ scrollTrigger: { trigger: ltRows.closest('.case'), containerAnimation: tween, start: 'left 70%', end: 'right left', scrub: true } })
      .fromTo(ltRows, { yPercent: 0 }, { yPercent: -13, ease: 'none' }, 0).fromTo(ltThumb, { yPercent: 0 }, { yPercent: 50, ease: 'none' }, 0);
  });
  mm.add('(max-width: 899px), (max-height: 559px)', () => {
    cards.forEach((card, i) => {
      gsap.from(card, { y: 50, opacity: .2, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%', onEnter: () => { if (workCount) workCount.textContent = String(i + 1).padStart(2, '0'); } } });
      const lt = $('.lt', card);
      if (lt && window.ltGauge) {  /* gauge draws with the card's slide-in: same trigger and easing, a touch quicker */
        const g = { p: 0 }; lt.classList.add('gs'); ltCtl(lt).set(0);
        gsap.fromTo(g, { p: 0 }, { p: 1, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' }, onUpdate: () => ltCtl(lt).set(g.p) });
      }
      const ab = $('.ab', card);
      if (ab && window.abCtl) {  /* Abacus: plays the bead sequence as the card slides in (same trigger), then loops */
        const g = { p: 0 }, c = abCtl(ab); c.set(0);
        gsap.fromTo(g, { p: 0 }, { p: 1, duration: 5.928, ease: 'none', scrollTrigger: { trigger: card, start: 'top 88%' }, onUpdate: () => c.set(g.p) });
      }
      gsap.fromTo($('.mock', card), { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    const ltRows = $('.case .lt-rows'), ltThumb = $('.case .lt-thumb');
    if (ltRows) gsap.timeline({ scrollTrigger: { trigger: ltRows.closest('.case'), start: 'top 70%', end: 'bottom top', scrub: true } })
      .fromTo(ltRows, { yPercent: 0 }, { yPercent: -13, ease: 'none' }, 0).fromTo(ltThumb, { yPercent: 0 }, { yPercent: 50, ease: 'none' }, 0);
  });


  /* ---------- experience rows ---------- */
  gsap.from('.row', { y: 30, opacity: .2, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.rows', start: 'top 85%' } });
  gsap.from('.toolkit .chip', { y: 12, opacity: 0, duration: .7, ease: 'expo.out', stagger: .04, scrollTrigger: { trigger: '.toolkit', start: 'top 92%' } });

  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
