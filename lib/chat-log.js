// Saves Afana AI conversations to Adnan's Notion database "Afana AI chats".
// One row per conversation; each question and answer is appended to the row's page.
// Needs NOTION_TOKEN on Vercel (a Notion internal integration that the database is shared with).
// Logging is best effort: any failure is written to the Vercel logs and never affects the chat.

const NOTION_VERSION = '2025-09-03';
const DATA_SOURCE = process.env.NOTION_CHATS_DATA_SOURCE || 'b2c094e2-479c-466d-8955-349d3ce62eaa';
const TIMEOUT = 5000;
const pages = new Map(); // chat id -> Notion page id, per server instance

async function notion(method, path, body) {
  const res = await fetch('https://api.notion.com/v1/' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + process.env.NOTION_TOKEN,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT)
  });
  if (!res.ok) throw new Error('Notion ' + method + ' ' + path.split('/')[0] + ' ' + res.status + ' ' + (await res.text().catch(() => '')).slice(0, 300));
  return res.json();
}

// Turn ```ui {json}``` layout blocks into readable text for the transcript.
function readable(answer) {
  return String(answer).replace(/```(?:ui|json)?\s*([\s\S]*?)```/g, (_, src) => {
    let b; try { b = JSON.parse(src.trim()); } catch (e) { return '\n(layout block)\n'; }
    const type = String(b.type || 'layout');
    const items = Array.isArray(b.items) ? b.items : (b.text ? [{ text: b.text, by: b.by }] : []);
    const lines = items.map(it => {
      if (typeof it === 'string') return '• ' + it;
      if (!it || typeof it !== 'object') return '';
      const head = it.title || it.label || it.value || it.when || '';
      const rest = [it.text, it.href || it.link, it.by].filter(Boolean).join(' · ');
      return '• ' + [head, rest].filter(Boolean).join(' — ');
    }).filter(Boolean);
    return '\n(Shown as ' + type + ')\n' + lines.join('\n') + '\n';
  }).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\n{3,}/g, '\n\n').trim();
}

// Notion allows 2000 characters per text run.
function runs(text, opts) {
  const out = [];
  for (let i = 0; i < text.length && out.length < 90; i += 1900) out.push({ type: 'text', text: { content: text.slice(i, i + 1900) }, ...(opts || {}) });
  return out;
}

function turnBlocks(question, answer, when) {
  const time = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' }).format(when);
  const label = (name) => ({ type: 'text', text: { content: name + '   ' }, annotations: { bold: true } });
  const stamp = { type: 'text', text: { content: time + '\n' }, annotations: { color: 'gray' } };
  return [
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [label('Visitor'), stamp, ...runs(question)] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [label('Afana AI'), { type: 'text', text: { content: '\n' } }, ...runs(readable(answer) || '(no answer)')] } }
  ];
}

// One-time setup: the chats table lives as a second data source inside the
// "Workshop registrations" database, which the integration can already reach.
const REG_DB = 'a77ed9ad5aad401e9160ef17605af152';
let dsReady = null;
async function ensureDataSource() {
  if (dsReady) return dsReady;
  dsReady = (async () => {
    const s = await notion('POST', 'search', { query: 'Afana AI chats', filter: { property: 'object', value: 'data_source' }, page_size: 10 });
    const hit = (s.results || []).find(r => (r.title || []).map(t => t.plain_text).join('') === 'Afana AI chats');
    if (hit) { console.log('Afana AI chats data source:', hit.id); return hit.id; }
    const ds = await notion('POST', 'data_sources', {
      parent: { type: 'database_id', database_id: REG_DB },
      title: [{ type: 'text', text: { content: 'Afana AI chats' } }],
      properties: {
        'First question': { title: {} },
        Started: { date: {} },
        'Last activity': { date: {} },
        Messages: { number: {} },
        Status: { select: { options: [{ name: 'New', color: 'blue' }, { name: 'Lead', color: 'green' }, { name: 'Recruiter', color: 'purple' }, { name: 'Needs better answer', color: 'orange' }, { name: 'Reviewed', color: 'default' }, { name: 'Spam', color: 'gray' }] } },
        Site: { select: { options: [{ name: 'adnanafana.com', color: 'pink' }, { name: 'Preview', color: 'gray' }] } },
        'Chat ID': { rich_text: {} }
      }
    });
    console.log('Afana AI chats data source CREATED:', ds.id);
    return ds.id;
  })();
  dsReady.catch(() => { dsReady = null; });
  return dsReady;
}
let DS = null;

async function findPage(chatId) {
  if (!DS) DS = await ensureDataSource();
  if (pages.has(chatId)) return pages.get(chatId);
  const r = await notion('POST', 'data_sources/' + DS + '/query', {
    filter: { property: 'Chat ID', rich_text: { equals: chatId } }, page_size: 1
  });
  const id = r.results && r.results[0] && r.results[0].id;
  if (id) pages.set(chatId, id);
  return id || null;
}

async function logTurn({ chatId, question, answer, count, site }) {
  if (!process.env.NOTION_TOKEN || !chatId || !question) return;
  try {
    const now = new Date();
    const iso = now.toISOString();
    const blocks = turnBlocks(question, answer, now);
    const pageId = await findPage(chatId);
    if (!pageId) {
      const page = await notion('POST', 'pages', {
        parent: { type: 'data_source_id', data_source_id: DS },
        icon: { type: 'emoji', emoji: '💬' },
        properties: {
          'First question': { title: runs(question.slice(0, 200)) },
          Started: { date: { start: iso } },
          'Last activity': { date: { start: iso } },
          Messages: { number: count },
          Status: { select: { name: 'New' } },
          Site: { select: { name: site } },
          'Chat ID': { rich_text: [{ type: 'text', text: { content: chatId } }] }
        },
        children: blocks
      });
      pages.set(chatId, page.id);
    } else {
      await Promise.all([
        notion('PATCH', 'blocks/' + pageId + '/children', { children: [{ object: 'block', type: 'divider', divider: {} }, ...blocks] }),
        notion('PATCH', 'pages/' + pageId, { properties: { 'Last activity': { date: { start: iso } }, Messages: { number: count } } })
      ]);
    }
  } catch (e) {
    console.error('Chat log to Notion failed:', e.message);
  }
}

module.exports = { logTurn, readable };
