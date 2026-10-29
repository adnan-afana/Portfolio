// Workshop registrations from /register/ → Adnan's Notion database "Workshop registrations".
// One row per sign-up. Nothing is emailed to anyone.
// Needs NOTION_TOKEN on Vercel: a Notion internal integration that the database is connected to.
// Optional: NOTION_REGISTRATIONS_DATA_SOURCE to point at a different database.

const NOTION_VERSION = '2025-09-03';
const DATA_SOURCE = process.env.NOTION_REGISTRATIONS_DATA_SOURCE || 'e8cc492e-de79-44aa-ae7b-0f3b024fd898';

const WORKSHOPS = ['Let AI do the busy work'];
const TOPICS = ['Customer emails', 'Social media posts', 'Marketing content', 'Bookkeeping & admin', 'Scheduling & bookings', 'Customer service'];
const TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'None yet'];

const clean = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const pick = (list, allowed) => (Array.isArray(list) ? list : []).map(x => String(x)).filter(x => allowed.includes(x)).filter((x, i, a) => a.indexOf(x) === i);
const text = s => (s ? [{ type: 'text', text: { content: s } }] : []);

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  if (!process.env.NOTION_TOKEN) return res.status(503).json({ error: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Bots fill the hidden field; pretend it worked and save nothing.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clean(body.name, 120), business = clean(body.business, 160);
  if (!name || !business) return res.status(400).json({ error: 'missing_fields' });
  const workshop = WORKSHOPS.includes(body.workshop) ? body.workshop : WORKSHOPS[0];

  const properties = {
    Name: { title: text(name) },
    Business: { rich_text: text(business) },
    Workshop: { select: { name: workshop } },
    Topics: { multi_select: pick(body.topics, TOPICS).map(n => ({ name: n })) },
    'Other topics': { rich_text: text(clean(body.otherTopics, 1500)) },
    'AI tools': { multi_select: pick(body.tools, TOOLS).map(n => ({ name: n })) },
    'Other AI tool': { rich_text: text(clean(body.otherTool, 200)) },
    Status: { select: { name: 'Registered' } },
    Site: { select: { name: process.env.VERCEL_ENV === 'production' ? 'adnanafana.com' : 'Preview' } }
  };

  try {
    const r = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.NOTION_TOKEN,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parent: { type: 'data_source_id', data_source_id: DATA_SOURCE }, properties }),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) {
      console.error('Notion registration failed', r.status, (await r.text().catch(() => '')).slice(0, 500));
      return res.status(502).json({ error: 'save_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Notion registration error', err && err.message);
    return res.status(502).json({ error: 'save_failed' });
  }
};
