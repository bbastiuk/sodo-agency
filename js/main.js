/* ═══════════════════════════════════════════════════════════
   SODO — сигнал у шумі

   Один генератор сигналу живить усе: відкриваючу секвенцію,
   фон сайту, скло кінескопа, монітор послуг і кадри робіт.
   Поле вмикається на першому кадрі й далі ніколи не
   перезапускається — стани лише переводять його в інші
   параметри. Тому сайт — це один світ, а не п'ять сторінок.
   ═══════════════════════════════════════════════════════════ */

(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const RM     = matchMedia('(prefers-reduced-motion: reduce)');
const FINE   = matchMedia('(hover:hover) and (pointer:fine)');
const NARROW = matchMedia('(max-width: 900px)');

const body = document.body;

/* Явне перевизначення для тих, у кого в системі вимкнені анімації,
   але хто хоче побачити повну версію: відкрити сайт із ?motion=full
   (запамʼятовується), повернути як було — ?motion=auto. */
const MOTION_KEY = 'sodo:motion';
let forceMotion = false;
try {
  const q = new URLSearchParams(location.search).get('motion');
  if (q === 'full') localStorage.setItem(MOTION_KEY, 'full');
  if (q === 'auto') localStorage.removeItem(MOTION_KEY);
  forceMotion = localStorage.getItem(MOTION_KEY) === 'full';
} catch { /* приватний режим — просто читаємо системну настройку */ }

const reduced = () => RM.matches && !forceMotion;

/* ───────────────────────────────────────────────
   1. ГЕНЕРАТОР СИГНАЛУ
   ─────────────────────────────────────────────── */

function surface(canvas, opts) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const o = Object.assign({
    scale: 0.5,   // роздільність буфера
    fps: 24,
    noise: 0.55,  // щільність смугового шуму
    band: 3,      // висота смуги шуму
    bands: 0,     // світлові смуги люмінофора
    bandA: 1,     // їх сила
    speed: 1,     // темп смуг
    bars: 0,      // вертикальний спектр
    pink: 0.5,    // частка рожевого
    lock: 1,      // біжуча смуга «захоплення»
    lift: 0,      // підняття чорного
    glow: 0,      // світіння трубки
    glowX: 0.42, glowY: 0.44,
  }, opts);

  let w = 0, h = 0, t = 0, raf = 0, mraf = 0, last = 0, live = false, tune = 0;

  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const s = o.scale * Math.min(devicePixelRatio || 1, 1.5);
    w = Math.max(2, Math.round(r.width * s));
    h = Math.max(2, Math.round(r.height * s));
    canvas.width = w; canvas.height = h;
    return true;
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    if (o.lift > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgba(22,14,18,${o.lift})`);
      g.addColorStop(0.55, `rgba(28,13,19,${o.lift * 0.55})`);
      g.addColorStop(1, `rgba(6,6,8,${o.lift})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    // світіння трубки — саме воно робить скло світлішим за корпус
    if (o.glow > 0) {
      const cx = w * o.glowX, cy = h * o.glowY;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.66);
      g.addColorStop(0, `rgba(122,44,66,${o.glow})`);
      g.addColorStop(0.3, `rgba(68,22,36,${o.glow * 0.72})`);
      g.addColorStop(0.58, `rgba(28,10,16,${o.glow * 0.46})`);
      g.addColorStop(1, 'rgba(5,5,9,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    // смуговий шум
    const step = Math.max(1, Math.round(o.band));
    for (let y = 0; y < h; y += step) {
      const drift = Math.sin((y * 0.03) + t * 0.6) * 0.5 + 0.5;
      const rows = 2 + Math.floor(drift * 6 * o.noise);
      for (let k = 0; k < rows; k++) {
        if (Math.random() > o.noise) continue;
        const x = Math.random() * w;
        const r = Math.random();
        const len = (1 + r * r * 44) * (0.35 + drift);
        const a = Math.random() * 0.105 * (0.5 + o.noise);
        ctx.fillStyle = Math.random() < o.pink * 0.25
          ? `rgba(250,155,182,${a * 1.15})`
          : `rgba(244,240,234,${a})`;
        ctx.fillRect(x, y, len, step - 1);
      }
    }

    // світлові смуги — головний мотив сигналу
    const nb = Math.round(o.bands);
    for (let i = 0; i < nb; i++) {
      const ph = t * 0.16 * o.speed + i * 1.83;
      const cy = (0.08 + (Math.sin(ph) * 0.5 + 0.5) * 0.84) * h;
      const bh = h * (0.018 + 0.055 * (Math.sin(ph * 1.27 + 1.2) * 0.5 + 0.5));
      const a = (0.05 + 0.1 * (Math.sin(ph * 0.83) * 0.5 + 0.5)) * o.bandA;
      const g = ctx.createLinearGradient(0, cy - bh, 0, cy + bh);
      g.addColorStop(0, 'rgba(250,155,182,0)');
      g.addColorStop(0.5, i % 3 === 0
        ? `rgba(255,242,247,${a * 1.2})`
        : `rgba(250,155,182,${a * 1.5})`);
      g.addColorStop(1, 'rgba(250,155,182,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, cy - bh, w, bh * 2);
    }

    // вертикальний спектр
    const n = Math.round(o.bars);
    if (n > 0) {
      const bw = Math.max(1, w / (n * 3.6));
      for (let i = 0; i < n; i++) {
        const v = (Math.sin(t * 1.5 + i * 0.7) * 0.5 + 0.5) *
                  (Math.sin(t * 0.4 + i * 1.9) * 0.5 + 0.5);
        const bh = h * (0.02 + v * 0.17);
        const x = (i + 0.5) * (w / n) - bw / 2;
        ctx.fillStyle = i % 4 === 0 ? 'rgba(250,155,182,.3)' : 'rgba(244,240,234,.085)';
        ctx.fillRect(x, h - bh, bw, bh);
      }
    }

    // смуга захоплення
    if (o.lock > 0.02) {
      const ly = ((t * 0.09) % 1.4 - 0.2) * h;
      const g = ctx.createLinearGradient(0, ly - h * 0.06, 0, ly + h * 0.06);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${0.07 * o.lock})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, ly - h * 0.06, w, h * 0.12);
    }
  }

  function loop(ts) {
    if (!live) return;
    raf = requestAnimationFrame(loop);
    // при зменшеному русі текстура не завмирає, але йде вдвічі повільніше:
    // це фон, а не рух вмісту — нічого не зсувається й не масштабується
    const fps = reduced() ? Math.min(o.fps, 10) : o.fps;
    if (ts - last < 1000 / fps) return;
    last = ts; t += (reduced() ? 0.03 : 0.05 + tune * 0.04);
    frame();
  }

  const api = {
    set(p) { Object.assign(o, p); if (!live && size()) frame(); },

    /* плавний перехід параметрів — текстура морфиться, а не стрибає */
    morph(to, ms = 700) {
      if (!to) return;
      if (reduced()) { api.set(to); return; }
      const from = {};
      for (const k in to) from[k] = o[k] === undefined ? 0 : o[k];
      const t0 = performance.now();
      cancelAnimationFrame(mraf);
      const stepFn = now => {
        const p = Math.min(1, (now - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        for (const k in to) o[k] = from[k] + (to[k] - from[k]) * e;
        if (p < 1) mraf = requestAnimationFrame(stepFn);
      };
      mraf = requestAnimationFrame(stepFn);
    },

    tune(v) { tune = v; },
    start() {
      if (live) return;
      if (!size()) return;
      live = true; raf = requestAnimationFrame(loop);
    },
    stop() { live = false; cancelAnimationFrame(raf); cancelAnimationFrame(mraf); },
    resize() { if (size()) frame(); },
  };
  return api;
}

/* ───────────────────────────────────────────────
   2. ЗЕРНО — глобальне скло
   ─────────────────────────────────────────────── */

function grain(canvas) {
  const ctx = canvas.getContext('2d');
  const tile = document.createElement('canvas');
  const T = 140;
  tile.width = tile.height = T;
  const tc = tile.getContext('2d');
  const img = tc.createImageData(T, T);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.random() * 150;
  }
  tc.putImageData(img, 0, 0);

  let pat = null, raf = 0, last = 0, live = false;
  function size() {
    canvas.width = Math.ceil(innerWidth / 2);
    canvas.height = Math.ceil(innerHeight / 2);
    pat = ctx.createPattern(tile, 'repeat');
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, -Math.random() * T, -Math.random() * T);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, canvas.width + T, canvas.height + T);
  }
  function loop(ts) {
    if (!live) return;
    raf = requestAnimationFrame(loop);
    if (ts - last < 90) return;
    last = ts; draw();
  }
  size();
  return {
    start() { if (live || reduced()) { draw(); return; } live = true; raf = requestAnimationFrame(loop); },
    resize() { size(); draw(); },
  };
}

/* ───────────────────────────────────────────────
   3. ПОВЕРХНІ
   ─────────────────────────────────────────────── */

/* спільне поле під усім сайтом */
const signal = surface($('#signal'), {
  scale: 0.45, fps: 26, noise: 1, band: 2, pink: 0.12, lift: 0.12, lock: 0,
});

/* стан → характер сигналу */
const FIELD = {
  boot:     { noise: 1,    band: 2, bands: 0, bars: 0, pink: 0.12, lift: 0.12, lock: 0,   fps: 28 },
  home:     { noise: 0.7,  band: 3, bands: 0, bars: 0, pink: 0.08, lift: 0.08, lock: 0,   fps: 18 },
  work:     { noise: 0.42, band: 3, bands: 4, bandA: 0.5, speed: 0.8, bars: 0, pink: 0.6, lift: 0.26, lock: 1, fps: 20 },
  services: { noise: 0.3,  band: 3, bands: 2, bandA: 0.4, speed: 0.5, bars: 0, pink: 0.3, lift: 0.14, lock: 0.6, fps: 18 },
  about:    { noise: 0.24, band: 4, bands: 1, bandA: 0.35, speed: 0.3, bars: 0, pink: 0.2, lift: 0.1, lock: 0, fps: 14 },
  contact:  { noise: 0.2,  band: 4, bands: 0, bars: 0, pink: 0.1, lift: 0, lock: 0, fps: 10 },
};

const crt = surface($('#crtCanvas'), {
  scale: 0.5, fps: 24, noise: 0.3, band: 3, bands: 5, speed: 1,
  pink: 1, lock: 1, lift: 0.26, glow: 0.62, glowX: 0.3, glowY: 0.44,
});

const mon = surface($('#monCanvas'), {
  scale: 0.5, fps: 24, noise: 0.42, band: 3, bands: 6, speed: 1.1,
  pink: 1, lock: 1, lift: 0.26, glow: 0.6, glowX: 0.46, glowY: 0.46,
});

const grainFx = grain($('#fxGrain'));

/* ───────────────────────────────────────────────
   4. ВІДКРИВАЮЧА СЕКВЕНЦІЯ
   ─────────────────────────────────────────────── */

const boot      = $('#boot');
const bootMark  = $('#bootMark');
const bootRx    = $('#bootRx');
const bootFlash = $('.boot__flash');
const slices    = $$('.mark i', bootMark);
const solid     = $('.mark__solid', bootMark);
const SEEN_KEY  = 'sodo:intro';

const cut  = 'cubic-bezier(.7,0,.2,1)';
const anim = (el, kf, opt) => el.animate(kf, Object.assign({ fill: 'both' }, opt));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* Темп відкриваючої секвенції. 1 — базовий (~5.4 с),
   0.8 — швидше, 1.3 — повільніше. */
const PACE = 1;

const bootLine  = $('#bootLine');
const bootPct   = $('#bootPct');
const bootAddr  = $('#bootAddr');
const bootCount = $('#bootCount');
const bootItems = $$('.bl', bootLine);
const bootMarks = $$('.boot__marks i');
const bootRule  = $('.boot__rule');

const ADDR = 'sodo://signal';

/* відсоток іде ривками, з паузами — як справжнє завантаження */
function countTo(ms) {
  return new Promise(res => {
    const t0 = performance.now();
    let shown = -1;
    const step = now => {
      const p = Math.min(1, (now - t0) / ms);
      // кусково-лінійна крива: ривок, пауза, ривок, довга пауза, фініш
      let e;
      if (p < 0.12)      e = p * 2.1;
      else if (p < 0.30) e = 0.252 + (p - 0.12) * 0.22;
      else if (p < 0.52) e = 0.292 + (p - 0.30) * 2.05;
      else if (p < 0.74) e = 0.743 + (p - 0.52) * 0.26;
      else               e = 0.800 + (p - 0.74) * 0.77;
      const v = Math.min(100, Math.round(e * 100));
      if (v !== shown) {
        shown = v;
        bootPct.textContent = String(v).padStart(2, '0') + '%';
      }
      if (p < 1) requestAnimationFrame(step);
      else { bootPct.textContent = '100%'; res(); }
    };
    requestAnimationFrame(step);
  });
}

/* лічильник кадрів унизу — просто біжить і завмирає на фіксації */
function runCounter() {
  const t0 = performance.now();
  let live = true;
  (function tick(now) {
    if (!live) return;
    requestAnimationFrame(tick);
    const n = Math.floor(((now || t0) - t0) * 17.3);
    bootCount.textContent = String(n % 100000).padStart(5, '0');
  })();
  return () => { live = false; };
}

/* адреса каналу набирається посимвольно */
function typeAddr(ms) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / ms);
      bootAddr.textContent = ADDR.slice(0, Math.round(p * ADDR.length));
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

/* Передача сайту.
   Знак не летить крізь заголовок — він стискається назад у лінію сигналу,
   розтягується на весь кадр і стає тією самою лінією, на якій стоїть герой. */
function collapseToRule(dur) {
  const lock = $('.lock');
  const a = bootMark.getBoundingClientRect();
  if (!lock || !a.width) return wait(dur);
  const b = lock.getBoundingClientRect();
  const sx = Math.min(2.6, (innerWidth * 1.04) / a.width);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  anim(bootRule, [{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.3, easing: 'linear' });
  const an = anim(bootMark, [
    { transform: 'none', opacity: 1 },
    { transform: `translate(0,${dy * 0.3}px) scaleY(.06) scaleX(1.08)`, opacity: 1, offset: 0.38 },
    { transform: `translate(0,${dy}px) scaleY(.012) scaleX(${sx})`, opacity: 1, offset: 0.72 },
    { transform: `translate(0,${dy}px) scaleY(.012) scaleX(${sx})`, opacity: 1, offset: 0.86 },
    { transform: `translate(0,${dy}px) scaleY(.012) scaleX(${sx})`, opacity: 0 },
  ], { duration: dur, easing: cut });
  return an.finished ? an.finished.catch(() => {}) : wait(dur);
}

async function runBoot(done) {
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === '1';
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch { /* приватний режим — просто програємо повну версію */ }

  signal.set(FIELD.boot);
  signal.start();

  const showMark = () => {
    solid.style.opacity = '1';
    slices.forEach(el => { el.style.opacity = '1'; });
  };

  /* ── зменшений рух ──
     Не «нічого»: та сама розповідь, але без руху. Лише прозорість
     і зміна тексту — жодних зсувів, масштабів і тремтіння.
     Користувач із вимкненими анімаціями все одно бачить секвенцію. */
  if (reduced()) {
    body.classList.add('is-tuned');
    bootMarks.forEach(m => { m.style.opacity = '1'; });
    bootItems.forEach(el => { el.style.opacity = '1'; });
    bootCount.style.opacity = '1';

    const stopCounter = runCounter();
    typeAddr(620);
    await countTo(1700);
    stopCounter();

    [...bootItems, bootCount].forEach(el =>
      anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'linear' }));
    await wait(230);

    showMark();
    anim(bootMark, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'linear' });
    anim(bootRule, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 200, easing: 'linear' });
    bootMarks.forEach(m =>
      anim(m, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 320, easing: 'linear' }));
    await wait(760);

    signal.set(FIELD.home);
    anim(bootMark, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'linear' });
    await wait(150);
    return done();
  }

  /* ── повторний вхід у сесії: коротка фіксація ── */
  if (seen) {
    body.classList.add('is-tuned');
    showMark();
    anim(bootMark, [
      { opacity: 0, transform: 'scaleY(.02)' },
      { opacity: 1, transform: 'scaleY(1.05)', offset: 0.45 },
      { opacity: 1, transform: 'none' },
    ], { duration: 320, easing: cut });
    anim(bootFlash, [{ opacity: 0 }, { opacity: 0.12, offset: 0.25 }, { opacity: 0 }],
         { duration: 170, easing: 'linear' });
    await wait(420);
    signal.morph(FIELD.home, 500);
    done();
    await collapseToRule(420);
    return;
  }

  const k = (NARROW.matches ? 0.86 : 1) * PACE;

  /* ── АКТ 1 · кадр розмічається ──────────────────── 0 → 620 */
  bootMarks.forEach((m, i) => anim(m, [{ opacity: 0 }, { opacity: 1 }],
    { duration: 90, delay: 120 * k + i * 70 * k, easing: 'steps(1,end)' }));
  await wait(240 * k);
  body.classList.add('is-tuned');

  /* стрічка проявляється зліва направо, кожен блок — із мерехтінням */
  bootItems.forEach((el, i) => anim(el, [
    { opacity: 0 }, { opacity: 1, offset: 0.25 },
    { opacity: 0.2, offset: 0.45 }, { opacity: 1 },
  ], { duration: 220, delay: i * 85 * k, easing: 'steps(2,end)' }));
  anim(bootCount, [{ opacity: 0 }, { opacity: 1 }],
       { duration: 160, delay: 420 * k, easing: 'steps(1,end)' });
  await wait(380 * k);

  /* ── АКТ 2 · завантаження ──────────────────── 620 → 3900 */
  const stopCounter = runCounter();
  typeAddr(900 * k);
  await countTo(3100 * k);

  /* ── АКТ 3 · фіксація ──────────────────────── 3900 → 4300 */
  stopCounter();
  anim(bootFlash, [
    { opacity: 0,    backgroundColor: '#F4F0EA' },
    { opacity: 0.72, backgroundColor: '#F4F0EA', offset: 0.1 },
    { opacity: 0.28, backgroundColor: '#FA9BB6', offset: 0.36 },
    { opacity: 0,    backgroundColor: '#FA9BB6' },
  ], { duration: 200, easing: 'linear' });

  // уся стрічка, крім центру, гасне; центр віддає місце знаку
  bootItems.forEach((el, i) => {
    if (i === 2) return;
    anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'steps(2,end)' });
  });
  anim(bootCount, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'steps(2,end)' });
  await wait(190 * k);
  anim(bootItems[2], [{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: 'steps(1,end)' });
  await wait(120 * k);

  /* ── АКТ 4 · знак ──────────────────────────── 4300 → 5000 */
  showMark();
  anim(bootMark, [
    { opacity: 0, transform: 'scale(.14) scaleY(.05)' },
    { opacity: 1, transform: 'scale(.34) scaleY(.5)', offset: 0.22 },
    { opacity: 1, transform: 'scale(1.03) scaleY(1.04)', offset: 0.72 },
    { opacity: 1, transform: 'none' },
  ], { duration: 520 * k, easing: cut });

  // по дорозі знак один раз розʼїжджається зрізами
  await wait(260 * k);
  slices.forEach(el => {
    const dx = (Math.random() * 2 - 1) * 26;
    anim(el, [
      { transform: 'none' },
      { transform: `translate3d(${dx}px,0,0)`, offset: 0.35 },
      { transform: `translate3d(${dx * 0.3}px,0,0)`, offset: 0.7 },
      { transform: 'none' },
    ], { duration: 240, easing: 'steps(3,end)' });
  });
  signal.set({ noise: 0.9, pink: 1, lock: 1 });
  await wait(360 * k);

  /* ── АКТ 5 · титр ──────────────────────────── 5000 → 5600 */
  anim(bootRule, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
       { duration: 320 * k, easing: cut });
  anim(bootMarks[0], [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 260 * k });
  anim(bootMarks[1], [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 300 * k });
  anim(bootMarks[2], [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 340 * k });
  anim(bootMarks[3], [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: 380 * k });
  await wait(560 * k);

  /* ── ПЕРЕДАЧА · знак стає лінією, на якій стоїть сайт ── */
  signal.morph(FIELD.home, 900);
  const handoff = collapseToRule(720 * k);
  await wait(520 * k);
  done();
  await handoff;
}

/* ───────────────────────────────────────────────
   5. МАРШРУТИЗАЦІЯ + ЗРИВ КАДРУ
   ─────────────────────────────────────────────── */

const PANELS = ['home', 'work', 'services', 'about', 'contact'];
const rip  = $('#rip');
const wash = $('#wash');
let current = 'home';
let ripTimer = 0, busy = false;

const scenes = {
  home:     { on() { crt.start(); }, off() { crt.stop(); } },
  work:     { on() {}, off() {} },
  services: { on() { mon.start(); }, off() { mon.stop(); } },
  about:    { on() {}, off() {} },
  contact:  { on() {}, off() {} },
};

function setNavState(id) {
  $$('.nav [data-nav], .menu__nav [data-nav]').forEach(a => {
    if (a.dataset.nav === id) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function swap(id) {
  const from = $('#' + current), to = $('#' + id);
  if (!to) return;
  if (from) { from.hidden = true; from.classList.remove('is-on', 'is-enter'); }
  to.hidden = false;
  to.classList.add('is-on');
  if (!reduced()) {
    to.classList.add('is-enter');
    setTimeout(() => to.classList.remove('is-enter'), 700);
  }
  current = id;
  body.dataset.panel = id;
  setNavState(id);

  signal.morph(FIELD[id], 620);
  for (const k in scenes) k === id ? scenes[k].on() : scenes[k].off();

  to.setAttribute('tabindex', '-1');
  to.focus({ preventScroll: true });
}

function go(id, push = true) {
  if (!PANELS.includes(id) || id === current || busy) return;
  closeMenu(false);
  if (push) history.pushState({ p: id }, '', id === 'home' ? location.pathname : '#' + id);

  if (reduced()) { swap(id); return; }

  busy = true;
  // у контакт рожевий заходить одним розрізом; назад — зрив кадру
  const toPink = id === 'contact';
  const layer = toPink ? wash : rip;
  layer.classList.remove('is-on');
  void layer.offsetWidth;
  layer.classList.add('is-on');

  clearTimeout(ripTimer);
  setTimeout(() => swap(id), toPink ? 230 : 140);
  ripTimer = setTimeout(() => {
    layer.classList.remove('is-on');
    busy = false;
  }, toPink ? 560 : 520);
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[data-nav]');
  if (!a) return;
  e.preventDefault();
  go(a.dataset.nav);
});

addEventListener('popstate', () => {
  const id = (location.hash || '#home').slice(1);
  go(PANELS.includes(id) ? id : 'home', false);
});

/* ───────────────────────────────────────────────
   6. МОБІЛЬНЕ МЕНЮ
   ─────────────────────────────────────────────── */

const menu = $('#menu'), burger = $('#burger');
let menuOpen = false, lastFocus = null;

function openMenu() {
  if (menuOpen || !menu) return;
  menuOpen = true; lastFocus = document.activeElement;
  menu.hidden = false;
  requestAnimationFrame(() => menu.classList.add('is-on'));
  burger.setAttribute('aria-expanded', 'true');
  ($('a', menu) || menu).focus({ preventScroll: true });
}
function closeMenu(refocus = true) {
  if (!menuOpen || !menu) return;
  menuOpen = false;
  menu.classList.remove('is-on');
  menu.hidden = true;
  burger.setAttribute('aria-expanded', 'false');
  if (refocus && lastFocus) lastFocus.focus({ preventScroll: true });
}
burger?.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (menuOpen) { closeMenu(); return; }
    if (current !== 'home') go('home');
    return;
  }
  if (e.key === 'Tab' && menuOpen) {
    const f = $$('a,button', menu).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ───────────────────────────────────────────────
   7b. АНАЛОГОВИЙ AMBIENT
   Три дешеві шари: блукання світності, повільний дрейф
   скан-ліній (у CSS) і рідкісний зрив рядка. Усе — лише
   opacity й transform, типографіки не торкається.
   ─────────────────────────────────────────────── */

function ambient() {
  const root    = document.documentElement;
  const lum     = $('.fx--lum');
  const tear    = $('#fxTear');
  const signalC = $('#signal');
  const word    = $('.crt__word');

  /* A. світність: згладжене випадкове блукання ~14 кадрів/с */
  let v = 1, target = 1, last = 0, wasReduced = false;
  function flick(ts) {
    requestAnimationFrame(flick);
    if (document.hidden) return;
    if (reduced()) {
      // світність не гуляє: миготіння — це ризик для світлочутливих
      if (!wasReduced) {
        wasReduced = true;
        root.style.setProperty('--flick', '1');
        lum.style.opacity = '0';
      }
      return;
    }
    wasReduced = false;
    if (ts - last < 72) return;
    last = ts;
    if (Math.random() < 0.2) target = 0.974 + Math.random() * 0.026;
    v += (target - v) * 0.34;
    root.style.setProperty('--flick', v.toFixed(3));
    // те, що «яскравіше за норму», додає ледь помітний підйом
    lum.style.opacity = Math.max(0, (v - 0.996) * 1.4).toFixed(4);
  }
  requestAnimationFrame(flick);

  /* C+D. рідкісний зрив рядка з мікрозсувом кольору */
  function fireTear() {
    const d  = 70 + Math.random() * 70;
    const dx = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3);

    tear.style.top = (14 + Math.random() * 70) + '%';
    tear.animate([
      { opacity: 0 }, { opacity: 1, offset: 0.18 },
      { opacity: 1, offset: 0.72 }, { opacity: 0 },
    ], { duration: d, easing: 'steps(2,end)' });

    signalC.animate([
      { transform: 'none' },
      { transform: `translate3d(${dx}px,0,0)`, offset: 0.3 },
      { transform: `translate3d(${dx * 0.4}px,0,0)`, offset: 0.7 },
      { transform: 'none' },
    ], { duration: d, easing: 'steps(3,end)' });

    // знак на склі вже має рожеве світіння — зсув на 1–2px читається
    // як розʼїзд каналів, без окремого фільтра
    if (word) word.animate([
      { transform: 'none' },
      { transform: `translate3d(${dx * 0.5}px,0,0)`, offset: 0.4 },
      { transform: 'none' },
    ], { duration: d + 50, easing: 'steps(2,end)' });
  }

  (function schedule() {
    setTimeout(() => {
      if (!document.hidden && !reduced()) fireTear();
      schedule();
    }, 4000 + Math.random() * 5000);
  })();
}

/* ───────────────────────────────────────────────
   7c. ПЕРЕМИКАЧ РУХУ

   Windows-настройка «Ефекти анімації» вимикає анімації для всіх
   сайтів одразу. Щоб не залежати від неї — клавіша M вмикає повний
   рух вручну. Працює й там, де параметр в URL не доходить
   (наприклад, коли сторінка відкрита всередині iframe).
   ─────────────────────────────────────────────── */

function applyMotion() {
  body.classList.toggle('rm', reduced());
  signal.stop(); signal.start();
  crt.stop(); mon.stop();
  scenes[current]?.on();
}

addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
  if (e.key !== 'm' && e.key !== 'M' && e.key !== 'ь' && e.key !== 'Ь') return;
  forceMotion = !forceMotion;
  try {
    if (forceMotion) localStorage.setItem(MOTION_KEY, 'full');
    else localStorage.removeItem(MOTION_KEY);
  } catch { /* сховище недоступне — перемикач живе до перезавантаження */ }
  applyMotion();
});

/* ледь помітне підстроювання від курсора — тільки на домі */
if (FINE.matches && !reduced()) {
  const crtEl = $('.crt');
  addEventListener('pointermove', e => {
    if (current !== 'home') return;
    const px = e.clientX / innerWidth - 0.5;
    const py = e.clientY / innerHeight - 0.5;
    signal.tune(Math.abs(px) * 0.5);
    crt.tune(Math.abs(px) * 0.6);
    signal.set({ noise: 0.62 + Math.abs(px) * 0.3 });
    // рухається один шар і не більше ніж на кілька пікселів
    if (crtEl) crtEl.style.transform = `translate3d(${(-px * 7).toFixed(1)}px,${(-py * 5).toFixed(1)}px,0)`;
  }, { passive: true });
}

/* ───────────────────────────────────────────────
   8. ПОСЛУГИ
   ─────────────────────────────────────────────── */

const SRV = [
  ['01', 'SMM', 'контент-стратегія, ведення та система присутності бренду',
    { bands: 6, speed: 1.1, bars: 0, noise: 0.42 }],
  ['02', 'Таргетована реклама', 'Meta Ads, Google Ads, аналітика та тестування звʼязок',
    { bands: 3, speed: 1.9, bars: 24, noise: 0.52 }],
  ['03', 'Сайти', 'digital-продукти, де дизайн, UX і конверсія працюють разом',
    { bands: 2, speed: 0.45, bars: 0, noise: 0.22 }],
  ['04', 'Чат-боти', 'автоматизація комунікації, заявок і внутрішніх процесів',
    { bands: 9, speed: 2.6, bars: 7, noise: 0.6 }],
  ['05', 'Стратегія', 'позиціонування, офер, воронка та логіка маркетингу',
    { bands: 1, speed: 0.3, bars: 0, noise: 0.16 }],
];

const monTxt = $('.mon__txt'), monN = $('#monN'), monName = $('#monName'), monD = $('#monD');
const monSlate = $('#monSlate');
let srvIdx = 0;

function pickSrv(i) {
  if (i === srvIdx || !SRV[i]) return;
  srvIdx = i;
  const [n, name, d, params] = SRV[i];
  $$('.srv').forEach((li, k) => li.classList.toggle('is-on', k === i));
  monN.textContent = n; monName.textContent = name; monD.textContent = d;
  if (monSlate) monSlate.textContent = 'канал ' + n;
  mon.morph(params, 260);
  if (!reduced()) {
    monTxt.classList.remove('is-swap'); void monTxt.offsetWidth; monTxt.classList.add('is-swap');
    if (monSlate) { monSlate.classList.remove('is-swap'); void monSlate.offsetWidth; monSlate.classList.add('is-swap'); }
  }
}
$$('.srv button').forEach((b, i) => {
  b.addEventListener('pointerenter', () => pickSrv(i));
  b.addEventListener('focus', () => pickSrv(i));
  b.addEventListener('click', () => pickSrv(i));
});

/* ───────────────────────────────────────────────
   9. РОБОТИ
   ─────────────────────────────────────────────── */

const CASES = [
  ['UMI', { bands: 4, speed: 0.8, noise: 0.4, bars: 0, pink: 0.6, bandA: 0.5 }],
  ['Razeb Studio', { bands: 8, speed: 2.2, noise: 0.58, bars: 28, pink: 1, bandA: 0.5 }],
];
const wGhost = $('#workGhost');
let caseIdx = 0;

function pickCase(i) {
  if (i === caseIdx || !CASES[i]) return;
  caseIdx = i;
  $$('.case').forEach((li, k) => li.classList.toggle('is-on', k === i));
  wGhost.classList.add('is-tear');
  setTimeout(() => {
    wGhost.textContent = CASES[i][0];
    wGhost.classList.remove('is-tear');
  }, 170);
  signal.morph(CASES[i][1], 280);
}
$$('.case a').forEach((a, i) => {
  a.addEventListener('pointerenter', () => pickCase(i));
  a.addEventListener('focus', () => pickCase(i));
});

/* ───────────────────────────────────────────────
   10. ФОРМА
   ─────────────────────────────────────────────── */

const form = $('#form'), sent = $('#sent'), formErr = $('#formErr');

$$('#form textarea').forEach(t => {
  const grow = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
  t.addEventListener('input', grow); grow();
});

form?.addEventListener('submit', e => {
  e.preventDefault();
  let bad = null;
  $$('.f', form).forEach(f => {
    const c = $('input, textarea', f);
    const ok = c.value.trim().length > 1;
    f.classList.toggle('is-bad', !ok);
    if (!ok && !bad) bad = c;
  });
  if (bad) {
    formErr.textContent = 'Заповніть, будь ласка, всі поля.';
    bad.focus();
    return;
  }
  formErr.textContent = '';
  form.hidden = true;
  $('.direct').hidden = true;
  sent.hidden = false;
  sent.focus({ preventScroll: true });
});

$('#sentBack')?.addEventListener('click', () => {
  sent.hidden = true;
  form.hidden = false;
  $('.direct').hidden = false;
  form.reset();
  $$('.f', form).forEach(f => f.classList.remove('is-bad'));
  $('#f-name').focus();
});

/* ───────────────────────────────────────────────
   11. СТАРТ
   ─────────────────────────────────────────────── */

let rz;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    grainFx.resize(); signal.resize(); crt.resize(); mon.resize();
  }, 160);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { signal.stop(); for (const k in scenes) scenes[k].off(); }
  else { signal.start(); scenes[current]?.on(); }
});

RM.addEventListener?.('change', () => body.classList.toggle('rm', reduced()));
if (reduced()) body.classList.add('rm');

function start() {
  runBoot(() => {
    body.classList.remove('is-booting');
    body.classList.add('is-live');
    grainFx.start();
    const id = (location.hash || '#home').slice(1);
    if (PANELS.includes(id) && id !== 'home') swap(id);
    else { scenes.home.on(); setNavState('home'); }
    ambient();
    setTimeout(() => boot.classList.add('is-done'), 1000);
  });
}

if (document.fonts && document.fonts.ready) {
  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(start);
} else {
  start();
}

})();
