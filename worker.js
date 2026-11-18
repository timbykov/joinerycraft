/* Joinerycraft website Worker.
   Serves the static site, plus one endpoint: /api/quote, which sends the quote request as a
   branded email with the cabinet list (CSV) and 3D model (.glb) attached.

   Sending is switched on by configuration, not code:
   - Resend: set the secret RESEND_API_KEY (and QUOTE_FROM on a domain verified in Resend), or
   - Cloudflare Email Service: add a send_email binding called EMAIL in wrangler.jsonc.
   QUOTE_TO is the inbox that receives quotes. Until one of these is set, GET /api/quote answers
   {ok:false} and the website keeps using Web3Forms. */

const MAX_BODY = 20 * 1024 * 1024; // 20 MB, leaves room under email size limits

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/quote') {
      if (request.method === 'GET') return json({ ok: configured(env) });
      if (request.method === 'POST') return sendQuote(request, env);
      return json({ ok: false, error: 'Method not allowed' }, 405);
    }
    return env.ASSETS.fetch(request);
  }
};

function configured(env) {
  return !!(env.QUOTE_TO && (env.RESEND_API_KEY || env.EMAIL));
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}

async function sendQuote(request, env) {
  if (!configured(env)) return json({ ok: false, error: 'Email is not set up' }, 503);
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) return json({ ok: false, error: 'Too large' }, 413);
  let q;
  try { q = await request.json(); } catch (e) { return json({ ok: false, error: 'Bad request' }, 400); }
  if (q['bot-field']) return json({ ok: true }); // spam honeypot: pretend it worked
  const f = q.fields || {};
  if (!f.name || !f.email || !f.phone) return json({ ok: false, error: 'Missing details' }, 400);

  const subject = 'New quote request: ' + (f.project || 'website') + ' from ' + f.name + (f.suburb ? ' (' + f.suburb + ')' : '');
  if (q.summary) q.summary = String(q.summary).replace(/^My design:\s*/, '');
  const html = renderHtml(f, q);
  const text = renderText(f, q);
  const attachments = [];
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const slug = String(q.mode || 'design').replace(/[^a-z]/g, '') || 'design';
  if (q.csv) attachments.push({ filename: 'joinerycraft-' + slug + '-cabinets-' + stamp + '.csv', type: 'text/csv', content: b64(q.csv) });
  if (q.glb) attachments.push({ filename: 'joinerycraft-' + slug + '-' + stamp + '.glb', type: 'model/gltf-binary', content: q.glb });

  const from = env.QUOTE_FROM || 'quotes@joinerycraft.com.au';
  try {
    if (env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: 'Joinerycraft website <' + from + '>', to: env.QUOTE_TO.split(',').map(s => s.trim()),
          reply_to: f.email, subject, html, text,
          attachments: attachments.map(a => ({ filename: a.filename, content: a.content }))
        })
      });
      if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()).slice(0, 300));
    } else {
      await env.EMAIL.send({
        from: { email: from, name: 'Joinerycraft website' }, to: env.QUOTE_TO.split(',').map(s => s.trim()),
        replyTo: f.email, subject, html, text,
        attachments: attachments.map(a => ({ filename: a.filename, type: a.type, content: a.content, disposition: 'attachment' }))
      });
    }
  } catch (e) {
    console.error('quote email failed', e && (e.code || ''), e && e.message);
    return json({ ok: false, error: 'Send failed' }, 502);
  }
  return json({ ok: true });
}

/* ---------- email content ---------- */
const OAK = '#9a6232', INK = '#1c1a17', MUTED = '#6b645b', TINT = '#f6f1ea', LINE = '#e2dbd0';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function safeLink(u) { return /^https:\/\/[^\s"<>]+$/.test(u || '') ? u : ''; }

function label(t) {
  return '<div style="font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:' + MUTED + ';margin:0 0 4px">' + esc(t) + '</div>';
}
function item(t, v) {
  if (!v) return '';
  return '<tr><td style="padding:10px 18px;border-bottom:1px solid ' + LINE + '">' + label(t) +
    '<div style="font:16px/1.45 Arial,Helvetica,sans-serif;color:' + INK + '">' + esc(v) + '</div></td></tr>';
}

function renderHtml(f, q) {
  const tel = String(f.phone || '').replace(/[^\d+]/g, '');
  const link = safeLink(q.link);
  const rows = String(q.details || '').split('\n').filter(Boolean);
  const sentLine = rows.length && /^Sent /.test(rows[0]) ? rows.shift() : '';
  const detailRows = rows.map(r => {
    const i = r.indexOf(': ');
    const k = i > 0 ? r.slice(0, i) : '', v = i > 0 ? r.slice(i + 2) : r;
    return '<tr><td style="padding:6px 12px 6px 0;font:13px/1.4 Arial,Helvetica,sans-serif;color:' + MUTED + ';vertical-align:top;white-space:nowrap">' + esc(k) +
      '</td><td style="padding:6px 0;font:14px/1.4 Arial,Helvetica,sans-serif;color:' + INK + ';vertical-align:top">' + esc(v) + '</td></tr>';
  }).join('');
  const files = [q.csv ? 'cabinet list (CSV)' : '', q.glb ? '3D model (.glb)' : ''].filter(Boolean);

  return '<!doctype html><html><body style="margin:0;padding:0;background:#eeece6">' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eeece6"><tr><td align="center" style="padding:28px 12px">' +
  '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff">' +
  // header bar
  '<tr><td style="background:' + INK + ';padding:22px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
  '<td style="font:300 20px/1 Arial,Helvetica,sans-serif;letter-spacing:.32em;color:#ffffff">JOINERYCRAFT</td>' +
  '<td align="right" style="font:600 11px/1 Arial,Helvetica,sans-serif;letter-spacing:.1em;color:#d9b48a">QUOTE REQUEST</td></tr></table></td></tr>' +
  // title + contact
  '<tr><td style="padding:30px 32px 6px">' +
  '<div style="font:26px/1.25 Georgia,\'Times New Roman\',serif;color:' + INK + '">' + esc((f.project || 'Quote') + ' quote from ' + f.name + (f.suburb ? ' (' + f.suburb + ')' : '')) + '</div>' +
  '<div style="font:15px/1.6 Arial,Helvetica,sans-serif;margin-top:6px">' +
  '<a href="mailto:' + esc(f.email) + '" style="color:' + OAK + '">' + esc(f.email) + '</a> &nbsp;&middot;&nbsp; ' +
  '<a href="tel:' + esc(tel) + '" style="color:' + OAK + '">' + esc(f.phone) + '</a></div>' +
  '<div style="font:15px/1.5 Arial,Helvetica,sans-serif;color:' + MUTED + ';margin-top:4px">Reply to this email to answer ' + esc(String(f.name).split(' ')[0]) + ' directly.</div></td></tr>' +
  // project card
  '<tr><td style="padding:18px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + TINT + ';border:1px solid ' + LINE + '">' +
  item('Project', f.project) + item('Suburb', f.suburb) + item('Stage', f.stage) + item('Timing', f.timing) + item('Budget', f.budget) + item('Heard about us', f.source) +
  '</table></td></tr>' +
  // their notes
  (f.details ? '<tr><td style="padding:22px 32px 0">' + label('Anything we should know') +
    '<div style="border-left:4px solid ' + OAK + ';background:' + TINT + ';padding:12px 16px;font:15px/1.55 Arial,Helvetica,sans-serif;color:' + INK + ';white-space:pre-wrap">' + esc(f.details) + '</div></td></tr>' : '') +
  // design
  (link || rows.length ? '<tr><td style="padding:26px 32px 0">' +
    '<div style="font:20px/1.3 Georgia,\'Times New Roman\',serif;color:' + INK + ';margin-bottom:6px">Their 3D design</div>' +
    (q.summary ? '<div style="font:15px/1.55 Arial,Helvetica,sans-serif;color:' + INK + ';margin-bottom:12px">' + esc(q.summary) + '</div>' : '') +
    (link ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 14px"><tr><td style="background:' + OAK + '">' +
      '<a href="' + esc(link) + '" style="display:inline-block;padding:12px 22px;font:700 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none">Open their 3D design</a></td></tr></table>' : '') +
    (sentLine ? '<div style="font:13px/1.5 Arial,Helvetica,sans-serif;color:' + MUTED + ';margin-bottom:10px">Snapshot ' + esc(sentLine.replace(/^Sent /, 'sent ')) + '. The link always opens exactly this design.</div>' : '') +
    (detailRows ? '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid ' + LINE + ';padding-top:6px">' + detailRows + '</table>' : '') +
    (files.length ? '<div style="font:13px/1.5 Arial,Helvetica,sans-serif;color:' + MUTED + ';margin-top:12px">Attached: ' + esc(files.join(' and ')) + '.</div>' : '') +
    '</td></tr>' : '') +
  // footer
  '<tr><td style="padding:30px 32px 0"></td></tr>' +
  '<tr><td style="background:#f3f1ec;padding:16px 32px;font:600 12px/1.5 Arial,Helvetica,sans-serif;color:' + MUTED + '">Joinerycraft website &middot; joinerycraft.com.au</td></tr>' +
  '</table></td></tr></table></body></html>';
}

function renderText(f, q) {
  const lines = [
    'New quote request', '',
    'Name: ' + f.name, 'Phone: ' + f.phone, 'Email: ' + f.email, 'Suburb: ' + (f.suburb || ''),
    'Project: ' + (f.project || ''), 'Stage: ' + (f.stage || ''), 'Timing: ' + (f.timing || ''), 'Budget: ' + (f.budget || ''),
    'Heard about us: ' + (f.source || '')
  ];
  if (f.details) lines.push('', 'Anything we should know:', f.details);
  if (q.summary) lines.push('', 'Their 3D design:', q.summary);
  if (q.link) lines.push('Open it: ' + q.link);
  if (q.details) lines.push('', q.details);
  return lines.join('\n');
}
