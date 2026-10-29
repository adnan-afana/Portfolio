/* Workshop registration page (/register/).
   On submit: emails the registration to Adnan in the background (FormSubmit), shows a success
   message, and adds the workshop to the visitor's calendar (.ics download + Google Calendar link). */
(() => {
  const NOTIFY = 'https://formsubmit.co/ajax/adnanafana0@gmail.com';
  const EVENT = {
    name: 'Let AI do the busy work',
    day: '2026-11-04',
    start: '20261104T170000Z',   // Wed, Nov 4, 2026, 12:00 PM Kingston time (EST, UTC-5)
    end: '20261104T180000Z',     // 1 hour
    when: 'Wednesday, November 4, 2026 at 12:00 PM',
    location: 'Fusion Meeting Room, Sonder Coworking, 945 Princess St, Kingston, ON',
    details: 'A practical AI workshop for business owners, led by Adnan Afana and hosted by Sonder Coworking & Events. https://adnanafana.com/register/'
  };

  const open = document.getElementById('rgOpen'), closed = document.getElementById('rgClosed'),
        done = document.getElementById('rgDone'), form = document.getElementById('askForm'),
        fail = document.getElementById('rgFail'), send = form.querySelector('.rg-send'),
        other = form.elements.toolOther;

  // After the workshop day (Kingston time), swap the form for a "has passed" note.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
  if (today > EVENT.day) { open.hidden = true; closed.hidden = false; return; }

  // Calendar links
  const esc = t => t.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Adnan Afana//Workshops//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:let-ai-do-the-busy-work-20261104@adnanafana.com',
    'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
    'DTSTART:' + EVENT.start, 'DTEND:' + EVENT.end,
    'SUMMARY:' + esc(EVENT.name),
    'LOCATION:' + esc(EVENT.location),
    'DESCRIPTION:' + esc(EVENT.details),
    'URL:https://adnanafana.com/register/',
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(EVENT.name) + ' starts in 1 hour', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const icsUrl = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const icsLink = document.getElementById('rgIcs');
  icsLink.href = icsUrl;
  document.getElementById('rgGcal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(EVENT.name)
    + '&dates=' + EVENT.start + '/' + EVENT.end
    + '&location=' + encodeURIComponent(EVENT.location)
    + '&details=' + encodeURIComponent(EVENT.details);

  // "Other" AI tool reveals a text field.
  form.querySelectorAll('input[name=tool]').forEach(r => r.addEventListener('change', () => {
    const on = r.value === 'other' && r.checked;
    other.hidden = !on;
    if (on) other.focus();
  }));

  const setErr = (input, msg) => {
    const wrap = input.closest('.rg-f');
    wrap.classList.toggle('is-bad', !!msg);
    wrap.querySelector('.rg-err').textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  form.querySelectorAll('[required]').forEach(i => i.addEventListener('input', () => { if (i.value.trim()) setErr(i, ''); }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    fail.hidden = true;
    const v = n => (form.elements[n].value || '').trim();
    let bad = null;
    [['name', 'Please add your name.'], ['business', 'Please add your business name.']].forEach(([n, m]) => {
      const i = form.elements[n];
      if (!v(n)) { setErr(i, m); bad = bad || i; } else setErr(i, '');
    });
    if (bad) { bad.focus(); return; }

    const topics = [...form.querySelectorAll('input[name=topics]:checked')].map(c => c.value);
    if (v('topic')) topics.push(v('topic'));
    const picked = form.querySelector('input[name=tool]:checked');
    const tool = !picked ? '' : picked.value === 'other' ? (v('toolOther') || 'Other') : picked.value;

    const label = send.querySelector('.btn-label'), was = label.textContent;
    send.disabled = true; label.textContent = 'Registering…';
    try {
      const r = await fetch(NOTIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `New registration: ${EVENT.name} · ${v('name')}, ${v('business')}`,
          _template: 'table',
          _captcha: 'false',
          _honey: v('_honey'),
          Workshop: `${EVENT.name} (${EVENT.when})`,
          Name: v('name'),
          'Business name': v('business'),
          'Would like the workshop to cover': topics.length ? topics.join('; ') : 'Nothing specific',
          'AI tool used every day': tool || 'Not specified'
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || String(data.success) === 'false') throw new Error(data.message || 'not sent');
    } catch (err) {
      send.disabled = false; label.textContent = was;
      fail.hidden = false;
      return;
    }

    // Success: thank them and add the workshop to their calendar.
    const first = v('name').split(/\s+/)[0];
    document.getElementById('rgWho').textContent = first ? ', ' + first : '';
    form.hidden = true; done.hidden = false;
    done.querySelector('.rg-h').focus({ preventScroll: true });
    done.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    icsLink.click();
  });
})();
