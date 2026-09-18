/* ============================================================
   SODO — main.js
   Vanilla JS, без залежностей. Скрол-залежний рух рахується прямо
   в обробнику scroll; rAF — лише для згладженого паралаксу від курсора.

   ⚙️  НАЛАШТУВАННЯ — див. CONFIG нижче (ендпоінт форми).
   ============================================================ */
(function () {
  'use strict';

  /* =========================================================
     CONFIG
     ========================================================= */

  // Ендпоінт форми (напр. Formspree: https://formspree.io/f/xxxxxxx).
  // Поки порожній — сайт НЕ вдає успішну відправку, а показує
  // прямі способи зв'язку. Впишіть свій — і форма запрацює.
  var FORM_ENDPOINT = '';

  // Пошта для запасного варіанту (mailto), якщо ендпоінта немає.
  var FALLBACK_EMAIL = 'hello@sodo.agency';
  var FALLBACK_TG = 'https://t.me/sodoagency';

  /* =========================================================
     Хелпери
     ========================================================= */
  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mqDesk = window.matchMedia('(min-width: 1024px)');

  var reduced = function () { return mqReduce.matches; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };

  function track(name, extra) {
    window.dataLayer = window.dataLayer || [];
    var o = { event: 'sodo_' + name };
    if (extra) for (var k in extra) o[k] = extra[k];
    window.dataLayer.push(o);
  }

  /* =========================================================
     1 · Вступ: без прелоадера, лише кадр на розкладку
     ========================================================= */
  function intro() {
    var hero = $('.hero');
    var go = function () {
      body.classList.remove('js-loading');
      if (hero) hero.classList.add('is-ready');
    };
    if (doc.fonts && doc.fonts.ready) {
      var done = false;
      var once = function () { if (!done) { done = true; requestAnimationFrame(go); } };
      doc.fonts.ready.then(once);
      setTimeout(once, 400); // шрифт не має затримувати вступ
    } else {
      requestAnimationFrame(go);
    }
  }

  /* =========================================================
     2 · Поява блоків
     ========================================================= */
  function reveals() {
    var targets = $$('.reveal, .case, .proc__step, .contact__title, .works__head, .srv__head');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     3 · Хедер: стан прокрутки + колір під секцією
     ========================================================= */
  var hdr = $('[data-hdr]');
  var themed = $$('[data-theme]');
  var lastTheme = '';

  function headerState(y) {
    if (!hdr) return;
    hdr.classList.toggle('is-stuck', y > 14);
    var line = y + (hdr.offsetHeight || 64) * 0.55;
    var theme = 'dark';
    for (var i = 0; i < themed.length; i++) {
      var el = themed[i];
      var top = el.getBoundingClientRect().top + y;
      if (top <= line) theme = el.getAttribute('data-theme');
    }
    if (theme !== lastTheme) {
      lastTheme = theme;
      hdr.classList.toggle('is-light', theme === 'light');
      hdr.classList.toggle('is-pink', theme === 'pink');
    }
  }

  /* =========================================================
     4 · Мобільне меню
     ========================================================= */
  function menu() {
    var btn = $('.burger');
    var panel = $('#menu');
    if (!btn || !panel) return;
    var open = false;

    function set(state) {
      open = state;
      btn.setAttribute('aria-expanded', String(state));
      body.classList.toggle('is-locked', state);
      if (state) {
        panel.hidden = false;
        requestAnimationFrame(function () { panel.classList.add('is-open'); });
        var first = $('a', panel);
        if (first) setTimeout(function () { first.focus(); }, 260);
      } else {
        panel.classList.remove('is-open');
        setTimeout(function () { if (!open) panel.hidden = true; }, 620);
      }
    }

    btn.addEventListener('click', function () { set(!open); });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) { set(false); btn.focus(); }
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { set(false); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (open && window.innerWidth >= 900) set(false);
    });
  }

  /* =========================================================
     5 · Послуги: розкриття (клік/клавіатура, наведення — бонус)
     ========================================================= */
  function services() {
    var list = $('[data-services]');
    if (!list) return;
    var items = $$('.srv', list);
    var hoverTimer = null;

    function setOpen(item, state) {
      var btn = $('.srv__btn', item);
      var panel = $('.srv__panel', item);
      if (!btn || !panel) return;
      item.classList.toggle('is-open', state);
      btn.setAttribute('aria-expanded', String(state));
      panel.setAttribute('data-open', String(state));
    }

    function openOnly(item) {
      items.forEach(function (it) { setOpen(it, it === item); });
    }

    items.forEach(function (item, i) {
      var btn = $('.srv__btn', item);
      setOpen(item, i === 0); // перший відкритий за замовчуванням

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        if (mqFine.matches) {
          if (!isOpen) { openOnly(item); track('service_open', { service: btn.textContent.trim() }); }
        } else {
          if (isOpen) setOpen(item, false);
          else { openOnly(item); track('service_open', { service: btn.textContent.trim() }); }
        }
      });

      item.addEventListener('mouseenter', function () {
        if (!mqFine.matches || reduced()) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { openOnly(item); }, 110);
      });
      item.addEventListener('mouseleave', function () { clearTimeout(hoverTimer); });
    });
  }

  /* =========================================================
     6 · Паралакс колажу від курсора
     ========================================================= */
  var parallaxItems = [];
  var px = 0, py = 0, tx = 0, ty = 0, parallaxOn = false;

  function parallaxInit() {
    var scope = $('[data-parallax]');
    if (!scope || !mqFine.matches || reduced()) return;
    parallaxItems = $$('[data-depth]', scope).map(function (el) {
      return { el: el, d: parseFloat(el.getAttribute('data-depth')) || 10, x: 0, y: 0 };
    });
    if (!parallaxItems.length) return;
    parallaxOn = true;
    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function parallaxFrame() {
    if (!parallaxOn) return;
    px = lerp(px, tx, 0.06);
    py = lerp(py, ty, 0.06);
    if (Math.abs(px - tx) < 0.0005 && Math.abs(py - ty) < 0.0005) return;
    parallaxItems.forEach(function (it) {
      var x = -px * it.d;
      var y = -py * it.d * 0.6;
      it.el.style.setProperty('--px', x.toFixed(2) + 'px');
      it.el.style.setProperty('--py', y.toFixed(2) + 'px');
      it.el.style.translate = x.toFixed(2) + 'px ' + y.toFixed(2) + 'px';
    });
  }

  /* =========================================================
     7 · Морфінг: кадр героя → плашка першого кейсу
     ========================================================= */
  var morph = { on: false, el: null, from: null, to: null, active: false };

  function morphInit() {
    var from = $('[data-morph="from"]');
    var to = $('[data-morph="to"]');
    if (!from || !to) return;
    var img = $('img', from);
    if (!img) return;

    var el = doc.createElement('div');
    el.className = 'morph';
    el.setAttribute('aria-hidden', 'true');
    var clone = doc.createElement('img');
    clone.src = img.currentSrc || img.src;
    clone.alt = '';
    el.appendChild(clone);
    body.appendChild(el);

    morph.el = el; morph.from = from; morph.to = to;
    morph.on = mqDesk.matches && !reduced();
  }

  function morphOff() {
    if (!morph.el) return;
    morph.el.style.display = 'none';
    if (morph.active) { body.classList.remove('is-morphing'); morph.active = false; }
  }

  function morphFrame(y, vh) {
    if (!morph.el) return;
    if (!morph.on) { morphOff(); return; }

    var fr = morph.from.getBoundingClientRect();
    var tr = morph.to.getBoundingClientRect();
    var fromAbs = fr.top + y;
    var toAbs = tr.top + y;

    var S = fromAbs + vh * 0.18;
    var E = toAbs - vh * 0.24;
    if (E - S < vh * 0.35) E = S + vh * 0.35;

    var p = clamp((y - S) / (E - S), 0, 1);

    if (p <= 0.002 || p >= 0.998) { morphOff(); return; }

    if (!morph.active) { body.classList.add('is-morphing'); morph.active = true; }
    var t = smooth(p);
    var x = lerp(fr.left, tr.left, t);
    var yy = lerp(fr.top, tr.top, t);
    var w = lerp(fr.width, tr.width, t);
    var h = lerp(fr.height, tr.height, t);

    var s = morph.el.style;
    s.display = 'block';
    s.width = w.toFixed(1) + 'px';
    s.height = h.toFixed(1) + 'px';
    s.transform = 'translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0)';
  }

  /* =========================================================
     8 · Фінал: рожевий екран розкривається
     ========================================================= */
  var pink = { sec: null, panel: null };

  function pinkInit() {
    pink.panel = $('[data-pink-panel]');
    pink.sec = $('.contact');
    if (pink.sec && reduced()) pink.sec.style.setProperty('--r', '1');
  }

  function pinkFrame(vh) {
    if (!pink.panel || !pink.sec || reduced()) return;
    var r = pink.panel.getBoundingClientRect();
    var p = clamp((vh - r.top) / (vh * 0.72), 0, 1);
    pink.sec.style.setProperty('--r', smooth(p).toFixed(3));
  }

  /* =========================================================
     9 · Оновлення: скрол — напряму, rAF — лише для плавного паралаксу
     ========================================================= */
  function scrollUpdate() {
    var y = window.pageYOffset || root.scrollTop || 0;
    var vh = window.innerHeight || 800;
    headerState(y);
    morphFrame(y, vh);
    pinkFrame(vh);
  }

  function loop() {
    parallaxFrame();
    requestAnimationFrame(loop);
  }

  /* =========================================================
     10 · Форма
     ========================================================= */
  function form() {
    var f = $('[data-form]');
    if (!f) return;
    var status = $('[data-form-status]', f);
    var fields = $$('.field', f);

    function fieldErr(field, show, msg) {
      var err = $('.field__err', field);
      var input = $('input, textarea', field);
      field.classList.toggle('has-err', show);
      if (err) {
        if (msg) err.textContent = msg;
        err.hidden = !show;
      }
      if (input) input.setAttribute('aria-invalid', String(show));
    }

    fields.forEach(function (field) {
      var input = $('input, textarea', field);
      if (!input) return;
      input.addEventListener('input', function () {
        if (field.classList.contains('has-err') && input.value.trim().length > 1) fieldErr(field, false);
      });
    });

    function say(text, isErr, html) {
      if (!status) return;
      status.classList.toggle('is-err', !!isErr);
      if (html) status.innerHTML = html; else status.textContent = text;
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (field) {
        var input = $('input, textarea', field);
        if (!input) return;
        var bad = input.value.trim().length < 2;
        fieldErr(field, bad);
        if (bad && !firstBad) firstBad = input;
      });

      if (firstBad) {
        say('', true, 'перевірте підсвічені поля — і надсилайте.');
        firstBad.focus();
        return;
      }

      var data = {
        name: $('#f-name').value.trim(),
        contact: $('#f-contact').value.trim(),
        task: $('#f-task').value.trim()
      };
      track('form_submit');

      if (!FORM_ENDPOINT) {
        // Чесний сценарій: інтеграції ще немає — не вдаємо успіх.
        var subject = encodeURIComponent('Заявка з сайту SODO — ' + data.name);
        var bodyTxt = encodeURIComponent(
          'Ім’я: ' + data.name + '\nКонтакт: ' + data.contact + '\nЗадача: ' + data.task
        );
        say('', false,
          '<b>форму ще не підключено до пошти.</b> щоб нічого не загубилось, надішліть це повідомлення напряму: ' +
          '<a href="mailto:' + FALLBACK_EMAIL + '?subject=' + subject + '&body=' + bodyTxt + '">листом</a> або ' +
          '<a href="' + FALLBACK_TG + '" target="_blank" rel="noopener">у telegram</a>. ' +
          'текст уже підставлено — залишиться натиснути «надіслати» у вашому застосунку.');
        return;
      }

      var btn = $('button[type="submit"]', f);
      if (btn) { btn.disabled = true; btn.dataset.txt = btn.textContent; btn.textContent = 'надсилаємо…'; }
      say('надсилаємо…', false);

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        f.reset();
        say('дякуємо — заявку надіслано. відповімо на вказаний контакт.', false);
        track('lead');
      }).catch(function () {
        say('', true,
          'не вдалося надіслати. напишіть, будь ласка, <a href="' + FALLBACK_TG + '" target="_blank" rel="noopener">у telegram</a> ' +
          'або на <a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.');
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.txt || 'надіслати'; }
      });
    });
  }

  /* =========================================================
     11 · Аналітика на кнопках
     ========================================================= */
  function analytics() {
    doc.addEventListener('click', function (e) {
      var el = e.target.closest('[data-track]');
      if (el) track(el.getAttribute('data-track'));
    });
  }

  /* =========================================================
     Старт
     ========================================================= */
  function init() {
    intro();
    reveals();
    menu();
    services();
    parallaxInit();
    morphInit();
    pinkInit();
    form();
    analytics();

    window.addEventListener('scroll', scrollUpdate, { passive: true });
    window.addEventListener('resize', function () {
      morph.on = !!morph.el && mqDesk.matches && !reduced();
      if (!morph.on) morphOff();
      scrollUpdate();
    }, { passive: true });

    if (mqReduce.addEventListener) {
      mqReduce.addEventListener('change', function () {
        morph.on = !!morph.el && mqDesk.matches && !reduced();
        if (!morph.on) morphOff();
        if (reduced() && pink.sec) pink.sec.style.setProperty('--r', '1');
        scrollUpdate();
      });
    }

    scrollUpdate();
    if (parallaxOn) requestAnimationFrame(loop);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
