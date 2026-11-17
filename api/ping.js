/* ТИМЧАСОВО: діагностика звʼязку з Telegram з боку Vercel. Нічого не
   надсилає й не показує жодних ключів — лише чи відкривається TCP/HTTPS
   до кількох адрес і скільки це триває. Видалити після перевірки. */
const https = require('node:https');
const dns = require('node:dns').promises;

const probe = (host, family) => new Promise(resolve => {
  const t0 = Date.now();
  const req = https.request({ host, path: '/', method: 'GET', family, timeout: 6000 }, res => {
    res.resume();
    resolve({ host, family, status: res.statusCode, ms: Date.now() - t0 });
  });
  req.on('timeout', () => req.destroy(new Error('timeout')));
  req.on('error', e => resolve({ host, family, error: e.message, ms: Date.now() - t0 }));
  req.end();
});

module.exports = async function handler(req, res) {
  const out = { region: process.env.VERCEL_REGION || null, node: process.version };
  try { out.dns4 = await dns.resolve4('api.telegram.org'); } catch (e) { out.dns4 = e.message; }
  try { out.dns6 = await dns.resolve6('api.telegram.org'); } catch (e) { out.dns6 = e.message; }
  out.probes = await Promise.all([
    probe('api.telegram.org', 4),
    probe('api.telegram.org', 6),
    probe('www.google.com', 4),
    probe('core.telegram.org', 4),
  ]);
  /* Чи живий ключ бота: getMe нічого не надсилає. Назовні — лише
     статус, час і опис помилки від Telegram, без ключа й без імені бота. */
  const tok = process.env.TG_TOKEN || '';
  out.tokenShape = { len: tok.length, trimmedDiffers: tok !== tok.trim(), hasColon: tok.includes(':') };
  out.chatShape = { len: (process.env.TG_CHAT || '').length };
  out.getMe = await new Promise(resolve => {
    const t0 = Date.now();
    const r = https.request({ host: 'api.telegram.org', path: `/bot${tok.trim()}/getMe`, method: 'POST', family: 4, timeout: 8000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': 2 } }, rs => {
      let b = ''; rs.on('data', c => { b += c; });
      rs.on('end', () => { let j = {}; try { j = JSON.parse(b); } catch {}
        resolve({ status: rs.statusCode, ok: j.ok, description: j.description || null, ms: Date.now() - t0 }); });
    });
    r.on('timeout', () => r.destroy(new Error('timeout')));
    r.on('error', e => resolve({ error: e.message, ms: Date.now() - t0 }));
    r.end('{}');
  });
  // для порівняння: явно фальшивий ключ і GET замість POST
  const call = (path, method) => new Promise(resolve => {
    const t0 = Date.now();
    const r = https.request({ host: 'api.telegram.org', path, method, family: 4, timeout: 8000 }, rs => {
      let b = ''; rs.on('data', c => { b += c; });
      rs.on('end', () => { let j = {}; try { j = JSON.parse(b); } catch {}
        resolve({ status: rs.statusCode, description: j.description || null, ms: Date.now() - t0 }); });
    });
    r.on('timeout', () => r.destroy(new Error('timeout')));
    r.on('error', e => resolve({ error: e.message, ms: Date.now() - t0 }));
    r.end();
  });
  out.fakeGet = await call('/bot123456:AAAAfakefakefakefakefakefakefakefake/getMe', 'GET');
  out.realGet = await call(`/bot${tok.trim()}/getMe`, 'GET');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(out);
};
