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
  var focusTrapRoot = null;

  function focusables(root) {
    if (!root) return [];
    return $$('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function trapFocus(e) {
    if (e.key !== 'Tab' || !focusTrapRoot) return;
    var items = focusables(focusTrapRoot);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function boot() {
    if (!loader) {
      body.classList.add('is-live');
      return;
    }

    if (reduced) {
      loader.classList.add('is-done');
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
      }, 240);
      return;
    }

    [
      { t: 100, w: '18%', status: 'SEARCHING FOR SIGNAL', code: 'NO SIGNAL' },
      { t: 460, w: '43%', status: 'SCANNING CHANNELS', code: 'CH 02 / 05' },
      { t: 900, w: '74%', status: 'LOCKING FREQUENCY', code: 'SODO / RX' },
      { t: 1380, w: '100%', status: 'SIGNAL FOUND', code: 'ONLINE' }
    ].forEach(function (stage) {
      setTimeout(function () {
        loaderBar.style.width = stage.w;
        loaderStatus.textContent = stage.status;
        loaderCode.textContent = stage.code;
      }, stage.t);
    });

    setTimeout(function () { body.classList.add('is-switching'); }, 1540);

    setTimeout(function () {
      loader.classList.add('is-done');
      body.classList.add('is-live');
      body.classList.remove('is-switching');
      try { sessionStorage.setItem('sodo-signal-seen', '1'); } catch (e) {}
    }, 1950);
  }

  function setupPointer() {
    if (!canHover || reduced) return;
    var cursor = $('#cursor');
    if (!cursor) return;

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
    if (reduced) {
      callback();
      return;
    }

    body.classList.remove('is-switching');
    void body.offsetWidth;
    body.classList.add('is-switching');

    setTimeout(callback, 155);
    setTimeout(function () { body.classList.remove('is-switching'); }, 450);
  }

  function openPanel(name, trigger) {
    var panel = $('[data-panel="' + name + '"]');
    if (!panel) return;

    lastFocus = trigger || document.activeElement;

    if (menu && menu.classList.contains('is-open')) {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    }

    signalTransition(function () {
      if (activePanel && activePanel !== panel) {
        activePanel.classList.remove('is-open');
        activePanel.setAttribute('aria-hidden', 'true');
      }

      activePanel = panel;
      focusTrapRoot = panel;
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');

      var first = focusables(panel)[0];
      if (first) first.focus({ preventScroll: true });
    });
  }

  function closePanel(withSignal) {
    if (!activePanel) return;
    var panel = activePanel;

    function finish() {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      activePanel = null;
      focusTrapRoot = null;

      if (lastFocus && lastFocus.focus) {
        lastFocus.focus({ preventScroll: true });
      }
    }

    if (withSignal === false || reduced) finish();
    else signalTransition(finish);
  }

  $$('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openPanel(btn.getAttribute('data-open'), btn);
    });
  });

  $$('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () { closePanel(true); });
  });

  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    focusTrapRoot = menu;
    if (menuButton) menuButton.setAttribute('aria-expanded', 'true');

    var first = focusables(menu)[0];
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(restoreFocus) {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    if (!activePanel) focusTrapRoot = null;

    if (restoreFocus !== false && lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  if (menuButton) menuButton.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', function () { closeMenu(true); });

  document.addEventListener('keydown', function (e) {
    trapFocus(e);

    if (e.key !== 'Escape') return;
    if (activePanel) closePanel(true);
    else if (menu && menu.classList.contains('is-open')) closeMenu(true);
  });

  function setupServicesPreview() {
    var monitor = $('.service-monitor');
    var title = $('#servicePreviewTitle');
    var note = $('#servicePreviewNote');
    if (!monitor || !title || !note) return;

    $$('.service-row').forEach(function (row) {
      function activate() {
        $$('.service-row').forEach(function (item) {
          item.classList.toggle('is-active', item === row);
        });

        monitor.dataset.mode = row.getAttribute('data-service') || 'ads';
        title.textContent = row.getAttribute('data-title') || '';
        note.textContent = row.getAttribute('data-note') || '';

        monitor.classList.remove('is-glitching');
        void monitor.offsetWidth;
        monitor.classList.add('is-glitching');
      }

      row.addEventListener('mouseenter', activate);
      row.addEventListener('focus', activate);
      row.addEventListener('click', activate);
    });
  }

  function setupMagnetic() {
    if (!canHover || reduced) return;

    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .10;
        var y = (e.clientY - r.top - r.height / 2) * .10;
        el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      });

      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  function setupAmbientSignal() {
    if (reduced) return;
    var screen = $('#crtScreen');
    if (!screen || !screen.animate) return;

    function pulse() {
      var wait = 4200 + Math.random() * 5600;

      setTimeout(function () {
        screen.animate([
          { transform: 'translateX(0)', filter: 'none' },
          { transform: 'translateX(-4px) skewX(-1deg)', filter: 'brightness(1.45) contrast(1.18)' },
          { transform: 'translateX(3px)', filter: 'hue-rotate(7deg)' },
          { transform: 'translateX(0)', filter: 'none' }
        ], {
          duration: 165,
          easing: 'steps(2,end)'
        });
        pulse();
      }, wait);
    }

    pulse();
  }


  function setupCrtTune() {
    var button = $('#crtTune');
    var crt = $('.crt');
    var channel = $('#crtChannel');
    var message = $('#crtMessage');
    var sub = $('#crtSub');
    if (!button || !crt || !channel || !message || !sub) return;

    var signals = [
      { ch: 'CH 09 / LIVE', main: 'SODO', sub: 'SIGNAL FOUND' },
      { ch: 'CH 12 / ATTENTION', main: 'NOTICE', sub: 'CUT THROUGH NOISE' },
      { ch: 'CH 21 / SYSTEM', main: 'DIGITAL', sub: 'STRATEGY / CREATIVE / TECH' },
      { ch: 'CH 33 / ACTION', main: 'MOVE', sub: 'MAKE PEOPLE ACT' }
    ];
    var index = 0;

    button.addEventListener('click', function () {
      index = (index + 1) % signals.length;
      var next = signals[index];

      crt.classList.remove('is-tuning');
      void crt.offsetWidth;
      crt.classList.add('is-tuning');

      setTimeout(function () {
        channel.textContent = next.ch;
        message.textContent = next.main;
        sub.textContent = next.sub;
      }, reduced ? 0 : 110);

      setTimeout(function () {
        crt.classList.remove('is-tuning');
      }, reduced ? 0 : 420);
    });
  }

  function setupBrandReset() {
    var brand = $('.brand');
    if (!brand) return;

    brand.addEventListener('click', function (e) {
      e.preventDefault();
      if (activePanel) closePanel(true);
      else if (!reduced) signalTransition(function () {});
    });
  }

  function setupForm() {
    var form = $('#leadForm');
    var status = $('#formStatus');
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = new FormData(form);
      var name = String(data.get('name') || '').trim();
      var contact = String(data.get('contact') || '').trim();
      var message = String(data.get('message') || '').trim();

      if (!name || !contact || !message) {
        status.textContent = 'Заповніть, будь ласка, усі три поля.';
        return;
      }

      var subject = encodeURIComponent('SODO — новий запит від ' + name);
      var bodyText = encodeURIComponent(
        'Імʼя: ' + name +
        '\nКонтакт: ' + contact +
        '\n\nЗадача:\n' + message
      );

      status.textContent = 'Запит підготовлено — відкриваємо пошту. Також можна написати нам напряму в Telegram або Instagram.';
      window.location.href = 'mailto:hello@sodo.agency?subject=' + subject + '&body=' + bodyText;
    });
  }

  boot();
  setupPointer();
  setupServicesPreview();
  setupMagnetic();
  setupAmbientSignal();
  setupCrtTune();
  setupBrandReset();
  setupForm();
})();