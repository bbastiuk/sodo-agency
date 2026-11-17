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
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(out);
};
