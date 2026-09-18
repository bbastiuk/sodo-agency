(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var body = document.body;
  var loader = $('#signalLoader');
  var loaderStatus = $('#loaderStatus');
  var loaderBar = $('#loaderBar');
  var loaderCode = $('#loaderCode');
  var menu = $('#mobileMenu');
  var menuButton = $('#menuButton');
  var mobileClose = $('#mobileClose');
  var activePanel = null;
  var lastFocus = null;

  function boot() {
    if (reduced) {
      if (loader) loader.classList.add('is-done');
      body.classList.add('is-live');
      return;
    }

    var seen = false;
    try { seen = sessionStorage.getItem('sodo-signal-seen') === '1'; } catch (e) {}

    if (seen) {
      loaderBar.style.width = '100%';
      loaderStatus.textContent = 'SIGNAL FOUND';
      loaderCode.textContent = 'ONLINE';
      setTimeout(function () {
        loader.classList.add('is-done');
        body.classList.add('is-live');
      }, 280);
      return;
    }

    var stages = [
      { t: 120, w: '18%', status: 'SEARCHING FOR SIGNAL', code: 'NO SIGNAL' },
      { t: 520, w: '44%', status: 'SCANNING CHANNELS', code: 'CH 02 / 05' },
      { t: 980, w: '72%', status: 'LOCKING FREQUENCY', code: '49.833 / 18.983' },
      { t: 1450, w: '100%', status: 'SIGNAL FOUND', code: 'ONLINE' }
    ];

    stages.forEach(function (stage) {
      setTimeout(function () {
        loaderBar.style.width = stage.w;
        loaderStatus.textContent = stage.status;
        loaderCode.textContent = stage.code;
      }, stage.t);
    });

    setTimeout(function () { body.classList.add('is-switching'); }, 1620);

    setTimeout(function () {
      loader.classList.add('is-done');
      body.classList.add('is-live');
      body.classList.remove('is-switching');
      try { sessionStorage.setItem('sodo-signal-seen', '1'); } catch (e) {}
    }, 2050);
  }

  function setPointer() {
    if (!canHover || reduced) return;
    var cursor = $('#cursor');
    var tx = -100, ty = -100, cx = tx, cy = ty;

    window.addEventListener('pointermove', function (e) {
      var nx = (e.clientX / window.innerWidth - .5) * 2;
      var ny = (e.clientY / window.innerHeight - .5) * 2;
      document.documentElement.style.setProperty('--mx', nx.toFixed(3));
      document.documentElement.style.setProperty('--my', ny.toFixed(3));
      tx = e.clientX - 22;
      ty = e.clientY - 22;
    }, { passive: true });

    function tick() {
      cx += (tx - cx) * .18;
      cy += (ty - cy) * .18;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(tick);
    }
    tick();

    $$('button,a,input,textarea').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-active'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-active'); });
    });
  }

  function signalTransition(callback) {
    if (reduced) { callback(); return; }
    body.classList.remove('is-switching');
    void body.offsetWidth;
    body.classList.add('is-switching');
    setTimeout(callback, 160);
    setTimeout(function () { body.classList.remove('is-switching'); }, 460);
  }

  function openPanel(name, trigger) {
    var panel = $('[data-panel="' + name + '"]');
    if (!panel) return;
    lastFocus = trigger || document.activeElement;
    if (menu && menu.classList.contains('is-open')) closeMenu();

    signalTransition(function () {
      if (activePanel && activePanel !== panel) closePanel(false);
      activePanel = panel;
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      body.style.overflow = 'hidden';
      var close = $('[data-close]', panel);
      if (close) close.focus({ preventScroll: true });
    });
  }

  function closePanel(withTransition) {
    if (!activePanel) return;
    var panel = activePanel;
    var doClose = function () {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      activePanel = null;
      body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (withTransition === false || reduced) doClose(); else signalTransition(doClose);
  }

  $$('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () { openPanel(btn.getAttribute('data-open'), btn); });
  });
  $$('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { closePanel(true); });
  });

  function openMenu() {
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    if (!activePanel) body.style.overflow = '';
  }

  if (menuButton) menuButton.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (activePanel) closePanel(true);
    else if (menu && menu.classList.contains('is-open')) closeMenu();
  });

  function servicesPreview() {
    var monitor = $('.service-monitor');
    var title = $('#servicePreviewTitle');
    var note = $('#servicePreviewNote');

    $$('.service-row').forEach(function (row) {
      var activate = function () {
        $$('.service-row').forEach(function (r) {
          r.classList.toggle('is-active', r === row);
        });

        title.textContent = row.getAttribute('data-title');
        note.textContent = row.getAttribute('data-note');

        monitor.classList.remove('is-glitching');
        void monitor.offsetWidth;
        monitor.classList.add('is-glitching');
      };

      row.addEventListener('mouseenter', activate);
      row.addEventListener('focus', activate);
      row.addEventListener('click', activate);
    });
  }

  function magnetic() {
    if (!canHover || reduced) return;

    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .12;
        var y = (e.clientY - r.top - r.height / 2) * .12;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });

      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  function randomSignal() {
    if (reduced) return;
    var screen = $('#crtScreen');
    if (!screen) return;

    function pulse() {
      var wait = 3800 + Math.random() * 5000;
      setTimeout(function () {
        screen.animate([
          { transform: 'translateX(0)', filter: 'none' },
          { transform: 'translateX(-4px) skewX(-1deg)', filter: 'brightness(1.5) contrast(1.2)' },
          { transform: 'translateX(3px)', filter: 'hue-rotate(8deg)' },
          { transform: 'translateX(0)', filter: 'none' }
        ], { duration: 170, easing: 'steps(2,end)' });
        pulse();
      }, wait);
    }

    pulse();
  }

  function form() {
    var f = $('#leadForm');
    var status = $('#formStatus');
    if (!f) return;

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(f);
      var name = String(data.get('name') || '').trim();
      var contact = String(data.get('contact') || '').trim();
      var message = String(data.get('message') || '').trim();

      if (!name || !contact || !message) {
        status.textContent = 'Заповніть, будь ласка, усі три поля.';
        return;
      }

      var subject = encodeURIComponent('SODO — новий запит від ' + name);
      var bodyText = encodeURIComponent('Імʼя: ' + name + '\nКонтакт: ' + contact + '\n\nЗадача:\n' + message);
      status.textContent = 'Відкриваємо пошту. Якщо зручніше — напишіть нам у Telegram або Instagram.';
      window.location.href = 'mailto:hello@sodo.agency?subject=' + subject + '&body=' + bodyText;
    });
  }

  boot();
  setPointer();
  servicesPreview();
  magnetic();
  randomSignal();
  form();
})();