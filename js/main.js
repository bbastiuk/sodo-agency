/* ============================================================
   SODO — ВИДИМІСТЬ

   Уся інтерактивність служить одному: приховане стає видимим.

   Одна ідея веде все: приховане стає видимим.

   1. лінза     — обличчя різкішає там, куди йде курсор
   2. поява     — блоки наводяться при вході в кадр
   3. послуги   — сцена відкриває, що саме ми робимо
   4. маршрут   — лінія веде через цикл SODO
   5. питання   — відповідь розкривається на дотик
   6. форма, мови, тон шапки, меню, дрібниці

   Без бібліотек. Усе, що рухається, знімається одним медіазапитом.
   ============================================================ */

(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const body = document.body;
const RM   = matchMedia('(prefers-reduced-motion: reduce)');
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const calm = () => RM.matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ────────────────────────────────────────────
   1. ЗАВАНТАЖЕННЯ
   ──────────────────────────────────────────── */

const SEEN = 'sodo:seen';

async function boot() {
  const word = $('#loadWord');
  const bar  = $('#loadBar');
  const sr   = $('#loadSr');

  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN) === '1';
    sessionStorage.setItem(SEEN, '1');
  } catch { /* приватний режим — програємо повну версію */ }

  const full = !seen && !calm();
  const dur  = full ? 720 : 220;
  const ease = 'cubic-bezier(.16,.84,.26,1)';

  word?.animate([
    { opacity: 0, filter: 'blur(22px)', letterSpacing: '.08em' },
    { opacity: 1, filter: 'blur(0px)',  letterSpacing: '-.02em' },
  ], { duration: dur, easing: ease, fill: 'both' });

  if (bar && full) {
    bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: dur + 140, easing: ease, fill: 'both' });
  }

  await wait(full ? 940 : 280);

  body.classList.remove('is-loading');
  body.classList.add('is-done');
  if (sr) sr.textContent = '';

  await wait(520);
  $('#load')?.remove();
}

/* ────────────────────────────────────────────
   2. ЛІНЗА

   Три речі водночас, усі підпорядковані одному — «приховане стає
   видимим», коли на нього дивляться:

   а) вікно різкості йде за курсором;
   б) три плани фігури зсуваються з різною амплітудою — глибина;
   в) радіус вікна залежить від того, наскільки курсор близько до
      фігури: дивишся впритул — видно більше, відводиш — вона тоне.

   Усе через CSS-змінні й один rAF: щокадру рухаються лише transform
   і градієнт маски, жоден filter не перераховується.
   ──────────────────────────────────────────── */

function lens() {
  const box = $('#fig');
  if (!box) return;

  const MR_NEAR = 330, MR_FAR = 150, PAR = 46;

  // ціль / поточне: усе лерпимо, щоб рух був важкий, а не смикався
  // стартуємо з нуля: спершу різкого немає, фокус наростає від руху
  let tx = 54, ty = 42, tr = 0, tpx = 0, tpy = 0;
  let cx = 54, cy = 42, cr = 0, cpx = 0, cpy = 0;
  let raf = 0, drift = 0;

  const near = (a, b) => Math.abs(a - b) < 0.04;

  // при зменшеному русі доганяємо майже миттєво: фокус є, інерції немає
  const K = calm() ? 0.55 : 0.12;

  const paint = () => {
    raf = 0;
    cx  += (tx  - cx)  * K;
    cy  += (ty  - cy)  * K;
    cr  += (tr  - cr)  * (calm() ? K : 0.09);
    cpx += (tpx - cpx) * 0.07;
    cpy += (tpy - cpy) * 0.07;

    box.style.setProperty('--mx', cx.toFixed(2) + '%');
    box.style.setProperty('--my', cy.toFixed(2) + '%');
    box.style.setProperty('--mr', cr.toFixed(1) + 'px');
    box.style.setProperty('--pp-x', cpx.toFixed(2) + 'px');
    box.style.setProperty('--pp-y', cpy.toFixed(2) + 'px');

    if (!near(tx, cx) || !near(ty, cy) || Math.abs(tr - cr) > 0.4 ||
        !near(tpx, cpx) || !near(tpy, cpy)) ask();
  };
  const ask = () => { if (!raf) raf = requestAnimationFrame(paint); };

  /* Сканування працює ЗАВЖДИ, а не тільки на дотику. Перевірка
     на pointer:fine була помилкою: у звуженому десктопному вікні
     вона збігається, і автоматичний рух не вмикався взагалі.
     Тепер курсор просто перехоплює керування, а через паузу
     без руху фігура знову починає скануватись сама. */
  const HANDOVER = 2400;
  let lastMove = -1e9, visible = true;

  addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    if (!r.width) return;
    lastMove = performance.now();

    tx = clamp(((e.clientX - r.left) / r.width) * 100, -14, 114);
    ty = clamp(((e.clientY - r.top) / r.height) * 100, -14, 114);

    // наскільки курсор далеко від центру фігури, у її власних півширинах
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const d  = clamp(Math.hypot(dx, dy * 0.7), 0, 1.6) / 1.6;
    tr = MR_FAR + (MR_NEAR - MR_FAR) * (1 - d);

    // плани йдуть проти курсора — назустріч погляду.
    // Це просторовий рух, тому при зменшеному русі його немає.
    const par = calm() ? 0 : PAR;
    tpx = clamp(-(e.clientX / innerWidth  - 0.5) * 2, -1, 1) * par;
    tpy = clamp(-(e.clientY / innerHeight - 0.5) * 2, -1, 1) * (par * 0.6);

    ask();
  }, { passive: true });

  /* Автоматичний обхід: вікно фокуса саме ходить по фігурі, як промінь.
     Синус пригальмовує на краях, тому це читається як обхід, а не
     бовтання. Повний прохід ≈ 8.7 с. Поза кадром цикл не крутиться. */
  if (!calm()) {
    const sweep = t => {
      drift = requestAnimationFrame(sweep);
      if (!visible || document.hidden) return;
      if (t - lastMove < HANDOVER) return;      // керує курсор
      const s = t / 1000;
      tx = 50 + Math.sin(s * 0.72) * 33;
      ty = 41 + Math.sin(s * 0.41 + 1.2) * 15;
      tr = 155 + Math.sin(s * 0.5) * 38;
      ask();
    };
    requestAnimationFrame(sweep);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; },
        { threshold: 0.05 }).observe(box);
    }
    addEventListener('pagehide', () => cancelAnimationFrame(drift), { once: true });
  }
}

/* ────────────────────────────────────────────
   3. ПОЯВА ПРИ СКРОЛІ
   ──────────────────────────────────────────── */

function reveals() {
  const items = $$('.rv');
  if (!items.length) return;

  if (calm() || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);   // наводимо один раз, назад не розмиваємо
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

  items.forEach(el => io.observe(el));
}

/* ────────────────────────────────────────────
   4. ШАПКА: ховання + тон

   Сайт світлий, але фінальний екран і підвал — чорні. Темний текст
   шапки над ними зникне, тому дивимось, що зараз лежить під нею.
   ──────────────────────────────────────────── */

function header() {
  const hd = $('#hd');
  const dark = $$('.talk, .ft');
  let last = scrollY, ticking = false;

  const step = () => {
    ticking = false;
    const y = scrollY;

    if (!body.classList.contains('is-menu')) {
      body.classList.toggle('is-hide', y > last && y > 240);
    }
    last = y;

    const at = (hd?.offsetHeight || 64) * 0.5;
    body.classList.toggle('is-ondark', dark.some(el => {
      const r = el.getBoundingClientRect();
      return r.top <= at && r.bottom > at;
    }));
  };

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(step);
  }, { passive: true });

  step();
}

/* ────────────────────────────────────────────
   5. МЕНЮ
   ──────────────────────────────────────────── */

function menu() {
  const btn = $('#menuBtn');
  const box = $('#menu');
  const lbl = $('.hd__menu-t');
  if (!btn || !box) return;

  let open = false, lastFocus = null;

  function set(state) {
    if (state === open) return;
    open = state;

    btn.setAttribute('aria-expanded', String(open));
    body.classList.toggle('is-locked', open);
    if (lbl) lbl.textContent = open ? lbl.dataset.close : lbl.dataset.open;

    if (open) {
      lastFocus = document.activeElement;
      box.hidden = false;
      // hidden знімає display:none — без рефлоу clip-path не програється
      void box.offsetHeight;
      body.classList.add('is-menu');
      requestAnimationFrame(() => $('a', box)?.focus({ preventScroll: true }));
    } else {
      body.classList.remove('is-menu');
      const hide = () => { box.hidden = true; };
      calm() ? hide() : setTimeout(hide, 600);
      lastFocus?.focus({ preventScroll: true });
    }
  }

  btn.addEventListener('click', () => set(!open));
  $$('a', box).forEach(a => a.addEventListener('click', () => set(false)));

  addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { e.preventDefault(); set(false); }
  });

  matchMedia('(min-width: 901px)').addEventListener?.('change', e => {
    if (e.matches) set(false);
  });
}

/* ────────────────────────────────────────────
   6. ДОВЖИНА ЛІНІЙ, ЯКІ МАЛЮЮТЬСЯ

   Лінія маршруту домальовується через stroke-dashoffset. Крива
   розтягнута preserveAspectRatio="none" і має non-scaling-stroke,
   тому штрих рахується в екранних пікселях, а не в координатах
   viewBox — getTotalLength() тут бреше. Міряємо реальну екранну
   довжину: беремо точки вздовж шляху, переганяємо їх матрицею у
   координати екрана й сумуємо відстані.
   ──────────────────────────────────────────── */

function screenLength(path, steps = 240) {
  const m = path.getScreenCTM();
  const L = path.getTotalLength();
  if (!m || !L) return L;
  let sum = 0, px = 0, py = 0;
  for (let i = 0; i <= steps; i++) {
    const p = path.getPointAtLength(L * i / steps);
    const x = m.a * p.x + m.c * p.y + m.e;
    const y = m.b * p.x + m.d * p.y + m.f;
    if (i) sum += Math.hypot(x - px, y - py);
    px = x; py = y;
  }
  return sum;
}

function strokes() {
  const paths = $$('.road__draw');
  if (!paths.length) return;

  const measure = () => paths.forEach(el => {
    const len = screenLength(el);
    if (len > 0) el.style.setProperty('--len', len.toFixed(1) + 'px');
  });

  measure();
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measure, 220); });
  return measure;
}

/* ────────────────────────────────────────────
   7. ПОСЛУГИ: СЦЕНА З ПЕРЕМИКАННЯМ

   Шість назв доступні одразу, сцена змінюється в контейнері сталого
   розміру. Дія одна й та сама на всіх пристроях — натискання;
   наведення лишається тільки підсвіткою в CSS, щоб курсор, який
   просто проходить повз список, нічого не перемикав.
   ──────────────────────────────────────────── */

function tabs() {
  const box = $('#sw');
  if (!box) return;
  const btns  = $$('.sw__tab', box);
  const panes = $$('.scene', box);
  if (btns.length !== panes.length || !btns.length) return;

  // hidden потрібен лише доки немає JS: далі видимістю керує CSS,
  // бо display:none не дає сцені плавно зʼявитись
  panes.forEach(el => el.removeAttribute('hidden'));

  let cur = 0;
  const show = i => {
    if (i === cur) return;
    cur = i;
    btns.forEach((b, k) => {
      const on = k === i;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panes.forEach((el, k) => el.classList.toggle('is-on', k === i));
  };

  btns.forEach((b, i) => b.addEventListener('click', () => show(i)));

  // стрілки водять по списку, як і належить вкладкам
  box.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const n = (cur + d + btns.length) % btns.length;
    show(n);
    btns[n].focus();
  });
}

/* ────────────────────────────────────────────
   8. МАРШРУТ «ЯК МИ ПРАЦЮЄМО»

   Лінія домальовується від прокрутки, етап отримує акцент, коли вона
   до нього доходить. Секція НЕ прилипає й нічого не затримує: прогрес
   рахується від її положення у вікні, тож швидка прокрутка просто
   швидше веде лінію. Поза кадром рахунок зупиняється.
   ──────────────────────────────────────────── */

function road() {
  const road = $('#road');
  if (!road) return;
  const steps = $$('.road__s', road);

  const light = p => {
    road.style.setProperty('--road', p.toFixed(3));
    steps.forEach((el, i) => el.classList.toggle('is-on', p >= (i + .55) / steps.length));
  };

  if (calm()) { light(1); return; }

  let ticking = false, visible = true;
  const step = () => {
    ticking = false;
    if (!visible) return;
    const r = road.getBoundingClientRect();
    const from = innerHeight * .9, to = innerHeight * .4;
    light(clamp((from - r.top) / Math.max(r.height + from - to, 1), 0, 1));
  };
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(step); } };

  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) ask();
    }, { rootMargin: '25% 0px' }).observe(road);
  }
  step();
}

/* ────────────────────────────────────────────
   9. ПИТАННЯ Й ВІДПОВІДІ

   Акордеон. Перші десять видно одразу, решта — під кнопкою.
   Висота анімується від реальної висоти вмісту, а не від max-height
   «на око»: інакше довгі відповіді або обрізаються, або відкриваються
   ривком після невидимого запасу.
   ──────────────────────────────────────────── */

function faq() {
  const list = $('#qaList');
  if (!list) return;

  $$('.qa', list).forEach(item => {
    const btn = $('.qa__q', item);
    const box = $('.qa__a', item);
    if (!btn || !box) return;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';

      if (open) {
        box.style.height = box.scrollHeight + 'px';
        requestAnimationFrame(() => { box.style.height = '0px'; });
        btn.setAttribute('aria-expanded', 'false');
        box.addEventListener('transitionend', function end(e) {
          if (e.propertyName !== 'height') return;
          box.removeEventListener('transitionend', end);
          box.hidden = true;
          box.style.height = '';
        });
      } else {
        box.hidden = false;
        const h = box.scrollHeight;
        box.style.height = '0px';
        requestAnimationFrame(() => { box.style.height = h + 'px'; });
        btn.setAttribute('aria-expanded', 'true');
        box.addEventListener('transitionend', function end(e) {
          if (e.propertyName !== 'height') return;
          box.removeEventListener('transitionend', end);
          box.style.height = 'auto';   // далі вміст може підрости сам
        });
      }
    });
  });

  const more = $('#qaMore');
  if (!more) return;
  const label = $('span', more);
  more.addEventListener('click', () => {
    const open = list.classList.toggle('is-open');
    more.setAttribute('aria-expanded', String(open));
    label.textContent = open ? more.dataset.less : more.dataset.more;
    if (!open) list.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' });
  });
}

/* ────────────────────────────────────────────
   10. ФОРМА

   FORM_ENDPOINT лишається порожнім, доки немає адреси приймача.
   Поки його нема, заявка не губиться: ми складаємо текст, кладемо
   його в буфер і відкриваємо Telegram — людина просто вставляє.
   Щойно зʼявиться endpoint, форма почне слати POST і нічого більше
   міняти не доведеться.
   ──────────────────────────────────────────── */

const FORM_ENDPOINT = '';
const FORM_TG = 'https://t.me/sodoagency';

function form() {
  const fm = $('#fm');
  if (!fm) return;
  const ok = $('#fmOk');
  const err = $('#fmErr');

  const say = msg => {
    err.textContent = msg;
    err.hidden = !msg;
  };

  fm.addEventListener('input', e => {
    const fld = e.target.closest('.fld');
    if (fld && e.target.value.trim()) { fld.classList.remove('is-bad'); say(''); }
  });

  fm.addEventListener('submit', async e => {
    e.preventDefault();

    const req = $$('[required]', fm);
    let bad = null;
    req.forEach(el => {
      const empty = !el.value.trim();
      el.closest('.fld').classList.toggle('is-bad', empty);
      if (empty && !bad) bad = el;
    });
    if (bad) {
      say('Заповніть, будь ласка, обовʼязкові поля.');
      bad.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(fm).entries());
    const done = () => {
      fm.hidden = true;
      ok.hidden = false;
      ok.scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' });
    };

    if (FORM_ENDPOINT) {
      try {
        const r = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error(r.status);
        done();
      } catch {
        say('Не вдалось надіслати. Напишіть нам у Telegram: t.me/sodoagency');
      }
      return;
    }

    // запасний шлях: нічого не губимо навіть без приймача
    const text = $$('.fld', fm).map(fld => {
      const el = $('input,textarea', fld);
      const lab = $('label span', fld)?.textContent.trim();
      return el.value.trim() ? `${lab}: ${el.value.trim()}` : null;
    }).filter(Boolean).join('\n');

    try { await navigator.clipboard.writeText(text); } catch { /* буфер закритий — не біда */ }
    open(FORM_TG, '_blank', 'noopener');
    done();
  });
}

/* ────────────────────────────────────────────
   11. МОВИ

   Українська лежить прямо в розмітці — її не треба тягнути й вона
   бачиться пошуком. Інші мови живуть у lang/<code>.json і
   підставляються в [data-i18n]. READY перелічує мови, у яких
   переклад уже заповнений: доки там одна мова, перемикач не
   показується взагалі, щоб ніхто не натиснув на порожнечу.
   ──────────────────────────────────────────── */

const READY = ['uk'];
const LANG_NAME = { uk: 'UA', pl: 'PL', en: 'EN' };
const LANG_KEY = 'sodo:lang';

async function langs() {
  const pick = () => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && READY.includes(q)) return q;
    try {
      const s = localStorage.getItem(LANG_KEY);
      if (s && READY.includes(s)) return s;
    } catch { /* приватний режим */ }
    return 'uk';
  };

  const apply = async code => {
    if (code !== 'uk') {
      const r = await fetch(`lang/${code}.json`, { cache: 'no-cache' });
      const d = await r.json();
      if (!d.ready) return;
      $$('[data-i18n]').forEach(el => {
        const v = d.strings[el.dataset.i18n];
        if (v) el.textContent = v;
      });
      // підписи, що живуть в атрибутах, а не в тексті вузла
      $$('[data-i18n-more]').forEach(el => {
        const m = d.strings[el.dataset.i18nMore], l = d.strings[el.dataset.i18nLess];
        if (m) el.dataset.more = m;
        if (l) el.dataset.less = l;
        const lab = $('span', el);
        if (lab && m && el.getAttribute('aria-expanded') !== 'true') lab.textContent = m;
      });
    }
    document.documentElement.lang = code;
    try { localStorage.setItem(LANG_KEY, code); } catch { /* ok */ }
  };

  const cur = pick();
  if (cur !== 'uk') { try { await apply(cur); } catch { /* лишаємось на uk */ } }

  if (READY.length < 2) return;
  const box = $('.mn__foot');
  if (!box) return;
  const nav = document.createElement('p');
  nav.className = 'mn__langs';
  READY.forEach(code => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = LANG_NAME[code] || code.toUpperCase();
    b.className = code === document.documentElement.lang ? 'is-on' : '';
    b.addEventListener('click', () => {
      const u = new URL(location.href);
      u.searchParams.set('lang', code);
      location.href = u.toString();
    });
    nav.appendChild(b);
  });
  box.appendChild(nav);
}

/* ────────────────────────────────────────────
   СТАРТ
   ──────────────────────────────────────────── */

reveals();
header();
menu();
lens();
tabs();
const remeasure = strokes();
road();
faq();
form();
langs();

const yr = $('#yr');
if (yr) yr.textContent = String(new Date().getFullYear());

/* Шрифти дисплейні (font-display:block), тож чекаємо — але не
   нескінченно і не довірливо. Якщо цей ланцюжок впаде, шар
   завантаження лишиться на весь екран і сайту просто не буде видно,
   тому його зняття не має права залежати від успіху. */
const ready = document.fonts?.ready
  ? Promise.race([document.fonts.ready, wait(900)]).catch(() => {})
  : Promise.resolve();

ready.then(() => {
  remeasure?.();
  return boot();
}).catch(() => {
  body.classList.remove('is-loading');
  body.classList.add('is-done');
  $('#load')?.remove();
});

})();
