/* ============================================================
   SODO — main.js
   Власний motion-движок без залежностей:
   сцени прив'язані до прогресу скролу, rAF — лише коли є рух.

   ⚙️  CONFIG — ендпоінт форми нижче.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  // Formspree або інший ендпоінт. Порожньо = сайт НЕ вдає успішну відправку.
  var FORM_ENDPOINT = '';
  var FALLBACK_EMAIL = 'hello@sodo.agency';
  var FALLBACK_TG = 'https://t.me/sodoagency';

  /* ---------- helpers ---------- */
  var doc = document, root = doc.documentElement, body = doc.body;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var mqWide = matchMedia('(min-width: 900px)');
  var reduced = function () { return mqReduce.matches; };

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };          // out-cubic
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var sub = function (p, from, to) { return clamp((p - from) / (to - from), 0, 1); };

  function track(name, extra) {
    window.dataLayer = window.dataLayer || [];
    var o = { event: 'sodo_' + name };
    if (extra) for (var k in extra) o[k] = extra[k];
    window.dataLayer.push(o);
  }

  /* ============================================================
     ДВИЖОК СЦЕН
     ============================================================ */
  var scenes = [];
  var vh = innerHeight, vw = innerWidth;

  function addScene(cfg) { scenes.push(cfg); }

  function measure() {
    vh = innerHeight; vw = innerWidth;
    scenes.forEach(function (s) { if (s.measure) s.measure(); s.last = -1; });
    render(true);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; render(false); });
  }

  function render(force) {
    var y = window.pageYOffset || root.scrollTop || 0;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      var p = s.range ? clamp((y - s.range[0]) / Math.max(1, s.range[1] - s.range[0]), 0, 1) : 0;
      if (force || Math.abs(p - s.last) > 0.0005) { s.last = p; s.update(p, y); }
    }
  }

  var absTop = function (el) { return el.getBoundingClientRect().top + (window.pageYOffset || 0); };

  /* ============================================================
     1 · СЦЕНА: ГЕРОЙ → ПЕРШИЙ КЕЙС
     ============================================================ */
  var LETTERS = [
    { x: -64, y: -8, r: -5, s: 1.55 },
    { x: -24, y: -34, r: 3, s: 1.3 },
    { x: 26, y: -38, r: -4, s: 1.35 },
    { x: 72, y: 6, r: 6, s: 1.5 }
  ];

  function sceneStage() {
    var stage = $('[data-stage]'); if (!stage) return;
    var pin = $('.stage__pin', stage);
    var hero = $('[data-hero]', stage);
    var slot = $('[data-slot]', stage);
    var cover = $('[data-cover]', stage);
    var meta = $('[data-cover-meta]', stage);
    var chrome = $('.mk__chrome', cover);
    var siteNav = $('.scr__nav', cover);
    var letters = $$('.word__l', stage);
    var frags = $$('.frag', stage);
    var copy = $('.hero__bottom', stage);
    var eyebrow = $('.hero__eyebrow', stage);
    var scrollCue = $('.hero__scroll', stage);
    if (!pin || !cover || !slot) return;

    var slotBox = null, covering = false;

    function measureSlot() {
      var pr = pin.getBoundingClientRect();
      var sr = slot.getBoundingClientRect();
      slotBox = { l: sr.left - pr.left, t: sr.top - pr.top, w: sr.width, h: sr.height };
    }

    addScene({
      last: -1,
      measure: function () {
        if (reduced()) { this.range = null; return; }
        var top = absTop(stage);
        this.range = [top, top + (stage.offsetHeight - vh)];
        measureSlot();
      },
      update: function (p) {
        if (reduced() || !slotBox) return;

        /* обкладинка: рамка з композиції → повний екран */
        var e = easeIO(sub(p, 0.06, 0.82));
        cover.style.left = lerp(slotBox.l, 0, e).toFixed(1) + 'px';
        cover.style.top = lerp(slotBox.t, 0, e).toFixed(1) + 'px';
        cover.style.width = lerp(slotBox.w, vw, e).toFixed(1) + 'px';
        cover.style.height = lerp(slotBox.h, vh, e).toFixed(1) + 'px';
        var f = sub(p, 0.16, 0.5);
        if (chrome) {
          chrome.style.opacity = (1 - f).toFixed(3);
          chrome.style.marginTop = (-chrome.offsetHeight * f).toFixed(1) + 'px';
        }
        var strip = $('.scr__strip', cover);
        if (strip) strip.style.opacity = (1 - sub(p, 0.62, 0.9)).toFixed(3);
        if (siteNav) {
          var f2 = sub(p, 0.34, 0.68);
          siteNav.style.opacity = (1 - f2).toFixed(3);
          siteNav.style.marginTop = (-siteNav.offsetHeight * f2).toFixed(1) + 'px';
        }

        var cov = p > 0.3;
        if (cov !== covering) { covering = cov; body.classList.toggle('is-covering', cov); }

        /* літери розлітаються */
        letters.forEach(function (el, i) {
          var t = easeIO(sub(p, 0.03 + i * 0.04, 0.62 + i * 0.04));
          var L = LETTERS[i] || LETTERS[0];
          el.style.transform =
            'translate(' + (L.x * t).toFixed(2) + 'vw,' + (L.y * t).toFixed(2) + 'vh) ' +
            'rotate(' + (L.r * t).toFixed(2) + 'deg) ' +
            'scale(' + (1 + (L.s - 1) * t).toFixed(3) + ')';
          el.style.opacity = (1 - sub(p, 0.34, 0.62)).toFixed(3);
        });

        /* фрагменти йдуть у глибину */
        frags.forEach(function (el, i) {
          var t = easeIO(sub(p, 0, 0.5 + i * 0.07));
          el.style.transform = 'translateY(' + (-16 * t).toFixed(2) + 'vh) scale(' + (1 - .14 * t).toFixed(3) + ')';
          el.style.opacity = (1 - sub(p, 0.12, 0.44)).toFixed(3);
        });

        /* текст героя */
        var o = 1 - sub(p, 0.02, 0.26);
        if (copy) { copy.style.opacity = o.toFixed(3); copy.style.transform = 'translateY(' + (26 * (1 - o)).toFixed(1) + 'px)'; }
        if (eyebrow) eyebrow.style.opacity = o.toFixed(3);
        if (scrollCue) scrollCue.style.opacity = o.toFixed(3);

        /* підпис кейсу */
        if (meta) {
          var m = sub(p, 0.84, 1);
          meta.style.opacity = m.toFixed(3);
          meta.style.transform = 'translateY(' + (20 * (1 - m)).toFixed(1) + 'px)';
          cover.style.setProperty('--scrim', sub(p, 0.6, 0.95).toFixed(3));
        }
      }
    });
  }

  /* ============================================================
     2 · ТИПОГРАФІЧНА ПАУЗА — рядки перебудовуються
     ============================================================ */
  function scenePause() {
    var sec = $('[data-pause]'); if (!sec) return;
    var lines = $$('[data-pause-line]', sec);
    var from = [10, -34, 4], to = [-16, 8, -26];

    addScene({
      last: -1,
      measure: function () {
        if (reduced()) { this.range = null; return; }
        var top = absTop(sec);
        this.range = [top - vh, top + sec.offsetHeight];
      },
      update: function (p) {
        if (reduced()) return;
        var t = easeIO(p);
        lines.forEach(function (el, i) {
          var x = lerp(from[i] || 0, to[i] || 0, t);
          el.style.transform = 'translateX(' + x.toFixed(2) + 'vw)';
          var span = el.firstElementChild;
          if (span) span.style.letterSpacing = lerp(-0.02, -0.075, t).toFixed(4) + 'em';
        });
      }
    });
  }

  /* ============================================================
     3 · СТРІЧКА КРЕАТИВІВ — горизонтальний рух
     ============================================================ */
  function sceneRail() {
    var rail = $('[data-rail]'); if (!rail) return;
    var row = $('[data-rail-row]', rail);
    var shift = 0;

    addScene({
      last: -1,
      measure: function () {
        if (reduced()) { this.range = null; row.style.transform = ''; return; }
        var top = absTop(rail);
        this.range = [top - vh, top + rail.offsetHeight];
        shift = Math.max(0, row.scrollWidth - vw + 32);
      },
      update: function (p) {
        if (reduced()) return;
        row.style.transform = 'translate3d(' + (-shift * p).toFixed(1) + 'px,0,0)';
      }
    });
  }

  /* ============================================================
     4 · ФІНАЛЬНА СЦЕНА — рожеве витісняє чорне
     ============================================================ */
  function sceneFin() {
    var fin = $('[data-fin]'); if (!fin) return;
    var panel = $('[data-fin-panel]', fin);
    var type = $('[data-fin-type]', fin);
    var card = $('[data-fin-card]', fin);
    var pinEl = $('.fin__pin', fin);
    var cut = null;

    if (!reduced() && type && mqWide.matches) {
      cut = type.cloneNode(true);
      cut.classList.add('fin__type--cut');
      cut.setAttribute('aria-hidden', 'true');
      cut.removeAttribute('data-fin-type');
      type.parentNode.insertBefore(cut, type.nextSibling);
    }

    addScene({
      last: -1,
      measure: function () {
        if (reduced()) { this.range = null; return; }
        var top = absTop(fin);
        this.range = [top - vh * 0.35, top + (fin.offsetHeight - vh)];
      },
      update: function (p) {
        if (reduced()) return;
        var rise = easeIO(sub(p, 0.12, 0.72));
        panel.style.transform = 'translate3d(0,' + ((1 - rise) * 100).toFixed(2) + '%,0)';

        if (cut) {
          var pr = pinEl.getBoundingClientRect();
          var tr = type.getBoundingClientRect();
          var edgePx = pr.top + pr.height * (1 - rise);           // верхня межа рожевого
          var insetPct = clamp((edgePx - tr.top) / Math.max(1, tr.height) * 100, 0, 100);
          cut.style.clipPath = 'inset(' + insetPct.toFixed(2) + '% 0 0 0)';
        }

        fin.classList.toggle('is-in', p > 0.16);
        if (!cut) fin.classList.toggle('is-pink', rise > 0.45);

        if (card) {
          var c = sub(p, 0.5, 0.82);
          card.style.opacity = c.toFixed(3);
          card.style.transform = 'translateY(calc(-50% + ' + (28 * (1 - c)).toFixed(1) + 'px))';
        }
      }
    });
  }

  /* ============================================================
     5 · ЛЕГКИЙ РУХ ФРАГМЕНТІВ КЕЙСУ 02
     ============================================================ */
  function sceneFloats() {
    var els = $$('[data-float]');
    if (!els.length || reduced()) return;
    var tick = false;

    function upd() {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var d = (r.top + r.height / 2 - vh / 2) / vh;
        var k = parseFloat(el.getAttribute('data-float')) || 0.1;
        el.style.transform = 'translate3d(0,' + (-d * k * 100).toFixed(1) + 'px,0)';
      });
    }
    addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () { tick = false; upd(); });
    }, { passive: true });
    upd();
  }

  /* ============================================================
     6 · ПОЯВА БЛОКІВ
     ============================================================ */
  function reveals() {
    var targets = $$('.reveal');
    if (!('IntersectionObserver' in window)) { targets.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (e) { io.observe(e); });
  }

  /* ============================================================
     7 · ХЕДЕР
     ============================================================ */
  function header() {
    var hdr = $('[data-hdr]'); if (!hdr) return;
    var themed = $$('[data-theme]');
    var lastTheme = '';
    function upd() {
      var y = window.pageYOffset || 0;
      hdr.classList.toggle('is-stuck', y > 20);
      var line = y + hdr.offsetHeight * 0.5;
      var theme = 'dark';
      for (var i = 0; i < themed.length; i++) {
        if (themed[i].getBoundingClientRect().top + y <= line) theme = themed[i].getAttribute('data-theme');
      }
      if (theme !== lastTheme) {
        lastTheme = theme;
        hdr.classList.toggle('is-light', theme === 'light');
        hdr.classList.toggle('is-pink', theme === 'pink');
      }
    }
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd, { passive: true });
    upd();
  }

  /* ============================================================
     8 · МЕНЮ
     ============================================================ */
  function menu() {
    var btn = $('.burger'), panel = $('#menu');
    if (!btn || !panel) return;
    var open = false;
    function set(v) {
      open = v;
      btn.setAttribute('aria-expanded', String(v));
      body.classList.toggle('is-locked', v);
      if (v) {
        panel.hidden = false;
        requestAnimationFrame(function () { panel.classList.add('is-open'); });
        var a = $('a', panel); if (a) setTimeout(function () { a.focus(); }, 300);
      } else {
        panel.classList.remove('is-open');
        setTimeout(function () { if (!open) panel.hidden = true; }, 700);
      }
    }
    btn.addEventListener('click', function () { set(!open); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) { set(false); btn.focus(); } });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { set(false); btn.focus(); } });
    addEventListener('resize', function () { if (open && innerWidth >= 900) set(false); });
  }

  /* ============================================================
     9 · ПОСЛУГИ: список + прев'ю, що перебудовується
     ============================================================ */
  function services() {
    var sec = $('[data-services]'); if (!sec) return;
    var items = $$('.srv__item', sec);
    var stage = $('[data-srv-stage]', sec);
    var views = $$('.srv__view', sec);
    var active = -1, hoverT = null;

    function setActive(i) {
      if (i === active) return;
      active = i;
      items.forEach(function (it, n) { it.classList.toggle('is-active', n === i); });
      views.forEach(function (v, n) { v.classList.toggle('is-on', n === i); });
      if (stage) {
        stage.setAttribute('data-active', String(i));
        var nm = $('.srv__name', items[i]);
        stage.setAttribute('data-label', (nm ? nm.textContent : '') + ' — демонстраційні макети');
      }
    }

    function setOpen(item, v) {
      var btn = $('.srv__btn', item), panel = $('.srv__panel', item);
      item.classList.toggle('is-open', v);
      btn.setAttribute('aria-expanded', String(v));
      panel.setAttribute('data-open', String(v));
    }

    items.forEach(function (item, i) {
      var btn = $('.srv__btn', item);
      setOpen(item, false);

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        items.forEach(function (o) { if (o !== item) setOpen(o, false); });
        setOpen(item, !isOpen);
        setActive(i);
        if (!isOpen) track('service_open', { service: $('.srv__name', item).textContent });
      });

      item.addEventListener('mouseenter', function () {
        if (!mqFine.matches) return;
        clearTimeout(hoverT);
        hoverT = setTimeout(function () { setActive(i); }, 70);
      });
      btn.addEventListener('focus', function () { setActive(i); });
    });

    setActive(0);
  }

  /* ============================================================
     10 · «ДИВИТИСЯ КЕЙС»
     ============================================================ */
  function collapsibles() {
    $$('[data-collapse]').forEach(function (panel) {
      var btn = $('[aria-controls="' + panel.id + '"]');
      if (!btn) return;
      panel.setAttribute('data-open', 'false');
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var open = panel.getAttribute('data-open') === 'true';
        panel.setAttribute('data-open', String(!open));
        btn.setAttribute('aria-expanded', String(!open));
        var span = $('span', btn);
        if (span) span.textContent = !open ? 'згорнути' : 'дивитися кейс';
      });
    });
  }

  /* ============================================================
     11 · КУРСОР І ЛЕГКИЙ ПАРАЛАКС
     ============================================================ */
  function cursor() {
    if (!mqFine.matches || reduced()) return;
    var el = doc.createElement('div');
    el.className = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span></span>';
    body.appendChild(el);
    var lbl = $('span', el);
    var x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, on = false, raf = 0;

    addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; el.classList.add('is-on'); cx = x; cy = y; }
      var t = e.target.closest('[data-cursor]');
      if (t) { el.classList.add('is-label'); lbl.textContent = t.getAttribute('data-cursor'); }
      else { el.classList.remove('is-label'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    addEventListener('mouseleave', function () { on = false; el.classList.remove('is-on'); });

    function loop() {
      cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      el.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) translate(-50%,-50%)';
      if (Math.abs(cx - x) > 0.4 || Math.abs(cy - y) > 0.4) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
  }

  function heroParallax() {
    var hero = $('[data-hero]'); if (!hero || !mqFine.matches || reduced()) return;
    var items = $$('[data-depth], .word__l', hero).map(function (el) {
      return { el: el, d: parseFloat(el.getAttribute('data-depth')) || 9 };
    });
    var tx = 0, ty = 0, px = 0, py = 0, raf = 0;
    addEventListener('mousemove', function (e) {
      tx = (e.clientX / innerWidth - .5) * 2;
      ty = (e.clientY / innerHeight - .5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      px = lerp(px, tx, .07); py = lerp(py, ty, .07);
      items.forEach(function (it) {
        it.el.style.translate = (-px * it.d).toFixed(2) + 'px ' + (-py * it.d * .55).toFixed(2) + 'px';
      });
      raf = (Math.abs(px - tx) > .001 || Math.abs(py - ty) > .001) ? requestAnimationFrame(loop) : 0;
    }
  }

  /* ============================================================
     12 · ФОРМА
     ============================================================ */
  function form() {
    var f = $('[data-form]'); if (!f) return;
    var status = $('[data-form-status]', f);
    var fields = $$('.field', f);

    function err(field, show) {
      var e = $('.field__err', field), i = $('input, textarea', field);
      field.classList.toggle('has-err', show);
      if (e) e.hidden = !show;
      if (i) i.setAttribute('aria-invalid', String(show));
    }
    fields.forEach(function (field) {
      var i = $('input, textarea', field);
      if (i) i.addEventListener('input', function () { if (field.classList.contains('has-err') && i.value.trim().length > 1) err(field, false); });
    });
    function say(html, isErr) {
      if (!status) return;
      status.classList.toggle('is-err', !!isErr);
      status.innerHTML = html;
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (field) {
        var i = $('input, textarea', field); if (!i) return;
        var v = i.value.trim().length < 2;
        err(field, v); if (v && !bad) bad = i;
      });
      if (bad) { say('перевірте підсвічені поля.', true); bad.focus(); return; }

      var data = { name: $('#f-name').value.trim(), contact: $('#f-contact').value.trim(), task: $('#f-task').value.trim() };
      track('form_submit');

      if (!FORM_ENDPOINT) {
        var subj = encodeURIComponent('Заявка з сайту SODO — ' + data.name);
        var txt = encodeURIComponent('Ім’я: ' + data.name + '\nКонтакт: ' + data.contact + '\nЗадача: ' + data.task);
        say('<b>форму ще не підключено до пошти.</b> щоб нічого не загубилось — надішліть це ' +
          '<a href="mailto:' + FALLBACK_EMAIL + '?subject=' + subj + '&body=' + txt + '">листом</a> або ' +
          '<a href="' + FALLBACK_TG + '" target="_blank" rel="noopener">у telegram</a>: текст уже підставлено.');
        return;
      }

      var btn = $('button[type="submit"]', f);
      if (btn) { btn.disabled = true; }
      say('надсилаємо…');
      fetch(FORM_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw 0;
        f.reset(); say('дякуємо — заявку надіслано.'); track('lead');
      }).catch(function () {
        say('не вдалося надіслати. напишіть <a href="' + FALLBACK_TG + '" target="_blank" rel="noopener">у telegram</a> або на <a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.', true);
      }).then(function () { if (btn) btn.disabled = false; });
    });
  }

  /* ============================================================
     СТАРТ
     ============================================================ */
  function init() {
    header();
    menu();
    services();
    collapsibles();
    reveals();
    form();
    cursor();
    heroParallax();

    sceneStage();
    scenePause();
    sceneRail();
    sceneFin();
    sceneFloats();

    measure();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 120); }, { passive: true });
    var rt = 0;

    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); });
    addEventListener('load', measure);

    doc.addEventListener('click', function (e) {
      var t = e.target.closest('[data-track]');
      if (t) track(t.getAttribute('data-track'));
    });

    if (mqReduce.addEventListener) mqReduce.addEventListener('change', function () { location.reload(); });

    if (/[?&]debug/.test(location.search)) window.__sodo = { scenes: scenes, render: render, measure: measure };
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
