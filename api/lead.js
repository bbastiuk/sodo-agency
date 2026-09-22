/* Приймач заявок. Стоїть між формою і Telegram, щоб токен бота
   лишався на сервері: сайт статичний, усе, що в ньому, видно всім.

   Змінні середовища (Vercel → Settings → Environment Variables):
     TG_TOKEN — токен від BotFather
     TG_CHAT  — chat_id, куди слати заявки
   У репозиторії їх немає і бути не повинно. */

const FIELDS = [
  ['name',    'Імʼя',                  true],
  ['contact', 'Telegram / Instagram',  true],
  ['phone',   'Телефон',               true],
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

  const miss = FIELDS.filter(([k, , req_]) => req_ && !clean(body[k])).map(([, label]) => label);
  if (miss.length) return res.status(400).json({ ok: false, miss });

  const lines = FIELDS
    .map(([k, label]) => [label, clean(body[k])])
    .filter(([, v]) => v)
    .map(([label, v]) => `<b>${esc(label)}:</b> ${esc(v)}`);

  const lang = clean(body.lang) || 'uk';
  const text = [`🔔 <b>Нова заявка з сайту</b>`, '', ...lines, '', `<i>мова: ${esc(lang)}</i>`].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: text.slice(0, 4000),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!r.ok) {
      /* Текст помилки йде тільки в лог Vercel — назовні віддаємо голий
         статус, щоб не підказувати, як влаштований приймач. */
      console.error('telegram', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('telegram unreachable', e);
    return res.status(502).json({ ok: false });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
