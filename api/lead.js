/* Приймач заявок. Стоїть між формою і Telegram, щоб токен бота
   лишався на сервері: сайт статичний, усе, що в ньому, видно всім.

   Змінні середовища (Vercel → Settings → Environment Variables):
     TG_TOKEN — токен від BotFather
     TG_CHAT  — chat_id, куди слати заявки
   У репозиторії їх немає і бути не повинно. */

const https = require('node:https');

const FIELDS = [
  ['name',    'Імʼя',                  true],
  ['contact', 'Telegram / Instagram',  true],
  ['phone',   'Телефон',               false],
  ['task',    'Задача',                false],
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Обрізаємо на вході: Telegram не бере повідомлення довші за 4096,
   а поле на 10 000 символів — це вже не заявка, а спроба щось зламати. */
const clean = v => String(v ?? '').trim().slice(0, 500);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const token = process.env.TG_TOKEN;
  const chat  = process.env.TG_CHAT;
  if (!token || !chat) {
    console.error('TG_TOKEN або TG_CHAT не задані');
    return res.status(500).json({ ok: false });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  if (!body) return res.status(400).json({ ok: false });

  /* Пастка для ботів: поле сховане від людини, тож заповнити його
     може тільки автомат. Відповідаємо успіхом — хай думає, що дійшло. */
  if (clean(body.company)) return res.status(200).json({ ok: true });

  /* Друга пастка — час. Сторінка рахує, скільки людина на ній була до
     відправки (t, мс). Людина не вписує імʼя й нік швидше за 3 секунди,
     а скрипт, що б'є прямо сюди, t не знає зовсім. */
  if (!(Number(body.t) >= 3000)) return res.status(200).json({ ok: true });

  const miss = FIELDS.filter(([k, , req_]) => req_ && !clean(body[k])).map(([, label]) => label);
  if (miss.length) return res.status(400).json({ ok: false, miss });

  const lines = FIELDS
    .map(([k, label]) => [k, label, clean(body[k])])
    .filter(([, , v]) => v)
    .map(([k, label, v]) => k === 'contact' ? contactLine(v, body.via) : `<b>${esc(label)}:</b> ${esc(v)}`);

  const lang = clean(body.lang) || 'uk';
  const text = [`🔔 <b>Нова заявка з сайту</b>`, '', ...lines, '', `<i>мова: ${esc(lang)}</i>`].join('\n');

  try {
    const r = await tg(token, {
      chat_id: chat,
      text: text.slice(0, 4000),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    if (r.status !== 200) {
      /* Текст помилки йде тільки в лог Vercel — назовні віддаємо голий
         статус, щоб не підказувати, як влаштований приймач. */
      console.error('telegram', r.status, r.body);
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('telegram unreachable', e && e.message);
    return res.status(502).json({ ok: false });
  }
};

/* Лист у Telegram. Не через fetch: на сервері він іноді йде на IPv6
   адресу api.telegram.org і висить без кінця, а людина на сайті дивиться
   на сіру кнопку. Тут тільки IPv4 і жорстка стеля 8 с — після неї
   відповідаємо помилкою, і сайт показує, куди написати напряму. */
function tg(token, payload) {
  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      family: 4,
      timeout: 8000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 300) }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout 8s')));
    req.on('error', reject);
    req.end(data);
  });
}

/* Рядок контакту: де людина просила писати і клікабельне посилання
   на профіль, щоб не шукати нік руками. Посилання в полі важить більше
   за вибір кнопки: вставили instagram.com/… — значить, Instagram. */
function contactLine(v, via) {
  const t = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  const m = t.match(/^(t\.me|telegram\.me|instagram\.com)\/([\w.]+)\/?$/i);
  const ig = m ? /instagram/i.test(m[1]) : via === 'instagram';
  const nick = m ? m[2] : t.replace(/^@/, '');
  const name = ig ? 'Instagram' : 'Telegram';
  if (!/^[A-Za-z0-9._]{2,32}$/.test(nick)) return `<b>${name}:</b> ${esc(v)}`;
  const href = ig ? `https://instagram.com/${nick}` : `https://t.me/${nick}`;
  return `<b>${name}:</b> <a href="${href}">@${nick}</a>`;
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
