/* ============================================================
   SODO — ВИДИМІСТЬ

   Уся інтерактивність служить одному: приховане стає видимим.

   Одна ідея веде все: приховане стає видимим.

   1. лінза     — обличчя різкішає там, куди йде курсор
   2. маркер    — рожеве підкреслення під головним словом, один раз
   3. поява     — блоки піднімаються при вході в кадр
   4. послуги   — картка послуги змінюється разом із табом
   5. кейси     — галерея гортається пальцем і стрілками
   6. цикл      — лінія веде через чотири кроки
   7. цифри     — статистика набігає від нуля
   8. питання   — відповідь розкривається на дотик
   9. липка дія — зʼявляється після героя, зникає біля форми
  10. форма, мови, тон шапки, меню, дрібниці

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
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });

  items.forEach(el => io.observe(el));
}

/* ────────────────────────────────────────────
   4. ШАПКА: ховання + тон

   Сайт світлий, але фінальний екран і підвал — чорні. Темний текст
   шапки над ними зникне, тому дивимось, що зараз лежить під нею.
   ──────────────────────────────────────────── */

function header() {
  const hd = $('#hd');
  /* Темні площини сайту — форма й підвал. Раніше тут стояв клас, якого
     в розмітці вже немає, тому над чорною формою шапка лишалась
     графітовою й зливалась із фоном. */
  const dark = $$('.form, .ft');
  let last = scrollY, ticking = false;

  const step = () => {
    ticking = false;
    const y = scrollY;

    if (!body.classList.contains('is-menu')) {
      body.classList.toggle('is-hide', y > last && y > 240);
    }
    // підкладка під шапкою: щойно під неї заходить зміст, логотип і
    // пункти меню перестають з ним змішуватись
    body.classList.toggle('is-scrolled', y > 12);
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
   ПЕРШИЙ ЕКРАН: ПОСАДКА СИЛУЕТУ

   Перший екран тепер чистий: логотип, візуал, висловлювання, дія.
   Силует займає всю вільну смугу між шапкою і заголовком, і межу цієї
   смуги ми не підбираємо відсотками, а міряємо — кегль заголовка
   плаває від ширини вікна, а висота самого вікна ще й змінюється,
   коли браузер згортає свої панелі. Міряємо через offsetTop —
   ця величина не залежить від transform, тож поява заголовка не
   збиває розрахунок.
   ──────────────────────────────────────────── */

function heroFit() {
  const hero = $('.hero');
  const h1   = $('#heroT');
  if (!hero || !h1) return () => {};

  const phone = matchMedia('(max-width: 620px)');
  let lastTop = -1, lastH = -1;

  const fit = () => {
    if (!phone.matches) {
      hero.style.removeProperty('--fig-top');
      hero.style.removeProperty('--fig-h');
      lastTop = lastH = -1;
      return;
    }
    if (!hero.offsetHeight) return;

    const top  = parseFloat(getComputedStyle(hero).paddingTop) || 0;
    const room = h1.offsetTop - top;
    // невеликий захід під заголовок: композиція лишається шаруватою,
    // але жодна літера не лягає на обличчя
    const over = Math.min(h1.offsetHeight * 0.18, 52);
    const h    = Math.max(room + over, 180);

    // Панелі браузера на телефоні згортаються й розгортаються під час
    // прокрутки і щоразу шлють resize. Висота героя від цього не
    // змінюється (100svh), тож переписуємо змінні лише коли число
    // справді інше — інакше силует смикався б на кожен рух.
    if (Math.abs(top - lastTop) < 1 && Math.abs(h - lastH) < 1) return;
    lastTop = top; lastH = h;
    hero.style.setProperty('--fig-top', top.toFixed(1) + 'px');
    hero.style.setProperty('--fig-h', h.toFixed(1) + 'px');
  };

  fit();
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 140); });
  addEventListener('orientationchange', () => setTimeout(fit, 260));
  phone.addEventListener?.('change', fit);
  return fit;
}

/* ────────────────────────────────────────────
   МАРКЕР ПІД ГОЛОВНИМ СЛОВОМ

   Рожеве підкреслення під «ПОМІЧАТИ» малюється рівно один раз після
   завантаження, за 600 мс, і більше нічого не робить. Сама анімація
   живе в CSS — тут лише вмикач. Рухається тільки transform: ширина,
   кегль і положення слова не змінюються.
   ──────────────────────────────────────────── */

function heroLit() {
  body.classList.add('is-lit');
}

/* ────────────────────────────────────────────
   ЗАГОЛОВОК, ЯКИЙ ЛАМАЄТЬСЯ ТІЛЬКИ МІЖ РЕЧЕННЯМИ

   «Один на нішу. Один на місто.» — дві окремі фрази, і перенос має
   право стояти лише між ними. Кожне речення стає inline-block, тож
   рядок або вміщує обидва, або кладе їх одне під одним; розірвати
   фразу посередині браузер уже не може. Текст не змінюється — ми
   тільки обгортаємо те, що вже стоїть.
   ──────────────────────────────────────────── */

function sentences() {
  $$('.one__t').forEach(el => {
    const src = el.dataset.src || (el.dataset.src = el.textContent.trim());
    const parts = src.split('. ').map((t, i, all) => i < all.length - 1 ? t + '.' : t);
    el.textContent = '';
    parts.forEach((t, i) => {
      const sp = document.createElement('span');
      sp.textContent = t;
      el.append(sp);
      if (i < parts.length - 1) el.append(' ');
    });
  });
}

/* ────────────────────────────────────────────
   ЦИФРИ ДОСВІДУ: ШВИДКА ЛІЧБА ВІД НУЛЯ

   Шаблонів немає: беремо текст, який уже стоїть, знаходимо в ньому всі
   числа й ведемо кожне від нуля до його ж значення. Тому «30+»,
   «3 роки 2 міс» і «52» оживають однаково, а в кінці повертається
   рівно вихідний рядок.

   Дві речі роблять лічбу швидкою, а не декоративною.

   Перша — рівний крок. Раніше тут стояло 1-(1-t)³: число доходило до
   29 і повзло до 30 чверть усього часу, а «3 роки 2 міс» майже пів
   секунди стояло на «2 роки 1 міс». Будь-яке сповільнення в кінці на
   лічильнику читається як затримка, тому крива тут пряма — саме так
   працює лічильник, а не декоративна анімація. Кроки виходять
   однакові: 19 мс на одиницю в «52», 333 мс у «3 роки 2 міс».

   Друга — округлення вниз. З Math.round число перестрибує через
   значення на початку; з floor воно справді проходить 0, 1, 2, 3…

   Тривалість 1 с. До першої появи в кадрі на місці цифри стоїть нуль,
   щоб фінальне значення ніде не блимнуло раніше за лічбу.
   ──────────────────────────────────────────── */

function counts() {
  const items = $$('[data-count]');
  if (!items.length) return;

  const D = 1000;
  const zeros = el => el.dataset.src.replace(/\d+/g, '0');

  const run = el => {
    const src = el.dataset.src;
    const nums = (src.match(/\d+/g) || []).map(Number);
    if (!nums.length) { el.textContent = src; return; }

    const t0 = performance.now();
    const frame = now => {
      const k = Math.min((now - t0) / D, 1);
      let i = 0;
      el.textContent = src.replace(/\d+/g, () => String(Math.floor(nums[i++] * k)));
      if (k < 1) requestAnimationFrame(frame);
      else el.textContent = src;              // повертаємо вихідний рядок дослівно
    };
    requestAnimationFrame(frame);
  };

  items.forEach(el => { el.dataset.src = el.textContent; });

  if (calm() || !('IntersectionObserver' in window)) return;

  items.forEach(el => { el.textContent = zeros(el); });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    run(e.target);
  }), { threshold: 0.4 });
  items.forEach(el => io.observe(el));
}

/* ────────────────────────────────────────────
   КЕЙСИ: ГОРИЗОНТАЛЬНА ГАЛЕРЕЯ

   Гортання пальцем працює саме собою — це звичайна горизонтальна
   прокрутка зі scroll-snap. Стрілки й лічильник потрібні на великих
   екранах і для клавіатури. Автопрокрутки немає: кейс читають, а не
   дивляться, як він тікає.
   ──────────────────────────────────────────── */

function gallery() {
  const track = $('#galTrack');
  if (!track) return;
  const items = $$('.case', track);
  if (!items.length) return;

  const nEl = $('#galN'), tEl = $('#galT');
  const prev = $('#galPrev'), next = $('#galNext');
  if (tEl) tEl.textContent = String(items.length);

  const pad = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;

  const cur = () => {
    const base = track.getBoundingClientRect().left + pad();
    let best = 0, d = Infinity;
    items.forEach((el, i) => {
      const dx = Math.abs(el.getBoundingClientRect().left - base);
      if (dx < d - 1) { d = dx; best = i; }
    });
    return best;
  };

  const sync = () => {
    const i = cur();
    if (nEl) nEl.textContent = String(i + 1);
    const end = track.scrollWidth - track.clientWidth;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= end - 2;
  };

  const go = d => {
    const i = clamp(cur() + d, 0, items.length - 1);
    const base = track.getBoundingClientRect().left + pad();
    const dx = items[i].getBoundingClientRect().left - base;
    track.scrollBy({ left: dx, behavior: calm() ? 'auto' : 'smooth' });
  };

  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; sync(); });
  }, { passive: true });
  addEventListener('resize', sync);
  sync();
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
  const cards = $$('.svc', box);
  const wrap  = $('#swBox');
  if (btns.length !== cards.length || !btns.length) return;

  let cur = 0;

  /* Картки лежать стосом в одній комірці сітки, тож сама по собі
     висота блоку дорівнювала б найвищій — під короткою послугою
     лишалась би порожнеча. Тому висоту веде активна картка. */
  const fit = () => {
    if (wrap) wrap.style.setProperty('--box', cards[cur].offsetHeight + 'px');
  };

  const show = i => {
    if (i === cur) return;
    cur = i;
    btns.forEach((b, k) => {
      const on = k === i;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    // спершу гасне попередня картка, тільки потім проступає нова —
    // черговість задана в CSS, тож дві ніколи не стоять разом
    cards.forEach((el, k) => el.classList.toggle('is-on', k === i));
    fit();
  };

  btns.forEach((b, i) => b.addEventListener('click', () => show(i)));

  fit();
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 140); });
  document.fonts?.ready.then(fit).catch(() => {});

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
   ЦИКЛ SODO: ЛІНІЯ ЗА ПРОКРУТКОЮ

   Пунктир попереду, суцільна рожева позаду — і це єдине, що показує
   прогрес: жоден крок не вицвітає, четвертий читається так само, як
   перший. Рейку міряємо від центра першої точки до центра останньої,
   інакше вона вилазила б під текст останнього кроку.
   ──────────────────────────────────────────── */

function road() {
  const list = $('#road');
  if (!list) return;
  const dots = $$('.road__n', list);
  if (!dots.length) return;

  const rail = () => {
    const box = list.getBoundingClientRect();
    const a = dots[0].getBoundingClientRect();
    const b = dots[dots.length - 1].getBoundingClientRect();
    list.style.setProperty('--rail-top', (a.top - box.top + a.height / 2 - 1).toFixed(1) + 'px');
    list.style.setProperty('--rail', (b.top - a.top).toFixed(1) + 'px');
  };

  rail();
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rail, 160); });
  document.fonts?.ready.then(rail).catch(() => {});

  if (calm()) { list.style.setProperty('--road', '1'); return; }

  let ticking = false, visible = true;
  const step = () => {
    ticking = false;
    if (!visible) return;
    const r = list.getBoundingClientRect();
    const from = innerHeight * 0.85, to = innerHeight * 0.4;
    list.style.setProperty('--road',
      clamp((from - r.top) / Math.max(r.height + from - to, 1), 0, 1).toFixed(3));
  };
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(step); } };

  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) ask(); },
      { rootMargin: '25% 0px' }).observe(list);
  }
  step();
}

/* ────────────────────────────────────────────
   ЛИПКА ДІЯ НА ТЕЛЕФОНІ

   Зʼявляється, коли перший екран із кнопкою вже пішов, і ховається,
   щойно в кадрі сама форма або підвал: дві однакові дії поруч тільки
   заважають. На широкому екрані її немає взагалі — це CSS.
   ──────────────────────────────────────────── */

function dock() {
  const el = $('#dock');
  const hero = $('.hero');
  if (!el || !hero || !('IntersectionObserver' in window)) return;
  el.hidden = false;

  let past = false;
  const near = new Set();
  const sync = () => body.classList.toggle('dock-on', past && !near.size);

  new IntersectionObserver(([e]) => { past = !e.isIntersecting; sync(); },
    { threshold: 0 }).observe(hero);

  const watch = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? near.add(e.target) : near.delete(e.target));
    sync();
  }, { threshold: 0 });
  [$('#form'), $('.ft')].forEach(t => t && watch.observe(t));
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
      // підписи, які читає лише зчитувач екрана
      $$('[data-i18n-aria]').forEach(el => {
        const v = d.strings[el.dataset.i18nAria];
        if (v) el.setAttribute('aria-label', v);
      });
      sentences();   // переклад стер обгортки — ділимо речення заново
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
const refit = heroFit();
road();
gallery();
dock();
sentences();
counts();
faq();
form();
langs();

/* Посилання для клавіатури не має лишатись у фокусі після переходу:
   інакше воно висить угорі весь час, поки людина читає сторінку. */
const skip = $('.skip');
skip?.addEventListener('click', () => setTimeout(() => skip.blur(), 0));

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
  refit?.();          // шрифт став на місце — міряємо смугу під силует
  return boot();
}).then(() => {
  refit?.();
  heroLit();          // маркер під словом малюється один раз
}).catch(() => {
  body.classList.remove('is-loading');
  body.classList.add('is-done');
  $('#load')?.remove();
});

})();
