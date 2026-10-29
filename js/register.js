/* Workshop registration page (/register/): validates the form and opens a pre-filled email. */
(() => {
  const TO = 'adnanafana0@gmail.com';
  const EVENT = { name: 'Let AI do the busy work', day: '2026-11-04', when: 'Wednesday, November 4, 2026 at 12:00 PM', short: 'Nov 4, 12:00 PM',
                  where: 'Sonder Coworking, 945 Princess St, Kingston' };

  const open = document.getElementById('rgOpen'), closed = document.getElementById('rgClosed'),
        done = document.getElementById('rgDone'), form = document.getElementById('askForm'),
        other = form.elements.toolOther;

  // After the workshop day (Kingston time), swap the form for a "has passed" note.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
  if (today > EVENT.day) { open.hidden = true; closed.hidden = false; return; }

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

  form.addEventListener('submit', e => {
    e.preventDefault();
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

    const subject = `Seat request: ${EVENT.name} (${EVENT.short}) · ${v('business')}`;
    const lines = [
      'Hi Adnan,', '',
      `I'd like a seat at the "${EVENT.name}" workshop on ${EVENT.when} (${EVENT.where}).`, '',
      `Name: ${v('name')}`,
      `Business name: ${v('business')}`,
      `Would like the workshop to cover: ${topics.length ? topics.join('; ') : 'Nothing specific'}`,
      `AI tool I use every day: ${tool || 'Not specified'}`, '',
      'Thanks!'
    ];
    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    form.hidden = true; done.hidden = false;
    done.querySelector('.rg-h').focus({ preventScroll: true });
    done.scrollIntoView({ block: 'nearest' });
  });

  document.getElementById('rgAgain').addEventListener('click', () => {
    done.hidden = true; form.hidden = false;
    form.elements.name.focus();
  });
})();
