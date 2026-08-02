/* ============================================================
   SODO Agency — main.js  (Vanilla JS, no dependencies)
   ------------------------------------------------------------
   EDIT ZONE below: form endpoint, case-study data.
   ============================================================ */
(function () {
  'use strict';

  /* =========================================================
     ⚙️  CONFIG — edit these
     ========================================================= */

  // Paste your Formspree (or other) endpoint. Empty = demo mode
  // (shows the success state without sending anywhere).
  // Example: "https://formspree.io/f/abcdwxyz"
  var FORM_ENDPOINT = '';

  // Case studies. Keep Street Barbershop factual (public data only).
  // The other three are TEMPLATES — replace "—" with real numbers.
  var CASES = [
    {
      logo: 'Street Barbershop',
      niche: { uk: 'Барбершоп · Познань', pl: 'Barbershop · Poznań' },
      task: {
        uk: 'Вибудовуємо digital-присутність і системний потік записів через контент, рекламу та зрозумілу онлайн-комунікацію.',
        pl: 'Budujemy obecność w digitalu i systemowy napływ rezerwacji przez treści, reklamę i jasną komunikację online.'
      },
      stats: [
        { v: '4.9',    l: { uk: 'рейтинг у Booksy',        pl: 'ocena w Booksy' } },
        { v: '3165',   l: { uk: 'відгуків клієнтів',        pl: 'opinii klientów' } },
        { v: 'Booksy', l: { uk: 'онлайн-запис клієнтів',    pl: 'rezerwacje online' } }
      ],
      note: {
        uk: 'Публічні показники профілю. Не всі відгуки та записи створені агенцією.',
        pl: 'Publiczne dane profilu. Nie wszystkie opinie i rezerwacje pochodzą od agencji.'
      }
    },
    {
      logo: 'FORMAI', template: true,
      niche: { uk: 'Виробництво · e-commerce', pl: 'Produkcja · e-commerce' },
      stats: [
        { v: '—', l: { uk: 'кількість заявок',   pl: 'liczba zgłoszeń' } },
        { v: '—', l: { uk: 'ціна ліда',           pl: 'koszt leada' } },
        { v: '—', l: { uk: 'ROAS',                pl: 'ROAS' } },
        { v: '—', l: { uk: 'зростання продажів',  pl: 'wzrost sprzedaży' } }
      ]
    },
    {
      logo: 'LegalizuYou', template: true,
      niche: { uk: 'Юридичні послуги', pl: 'Usługi prawne' },
      stats: [
        { v: '—', l: { uk: 'кількість заявок', pl: 'liczba zgłoszeń' } },
        { v: '—', l: { uk: 'ціна заявки',       pl: 'koszt zgłoszenia' } },
        { v: '—', l: { uk: 'географія',         pl: 'geografia' } },
        { v: '—', l: { uk: 'масштабування',     pl: 'skalowanie' } }
      ]
    },
    {
      logo: 'MS West', template: true,
      niche: { uk: 'Послуги · B2C', pl: 'Usługi · B2C' },
      stats: [
        { v: '—', l: { uk: 'кількість лідів', pl: 'liczba leadów' } },
        { v: '—', l: { uk: 'охоплення',       pl: 'zasięg' } },
        { v: '—', l: { uk: 'бюджет',          pl: 'budżet' } },
        { v: '—', l: { uk: 'результат',       pl: 'wynik' } }
      ]
    }
  ];

  /* =========================================================
     🌍  i18n dictionary (UA is source, PL is full translation)
     ========================================================= */
  var I18N = {
    uk: {
      'meta.title': 'SODO Agency — Meta Ads, Google Ads і SMM у Познані',
      'meta.desc': 'Бутикова digital-агенція SODO: Meta Ads, Google Ads, SMM, контент, брендинг і сайти. Приводимо клієнтів, а не просто підписників — по всьому світу.',
      'a11y.skip': 'Перейти до контенту',
      'nav.services': 'Послуги', 'nav.cases': 'Кейси', 'nav.about': 'Про нас', 'nav.process': 'Етапи', 'nav.contacts': 'Контакти',
      'cta.discuss': 'Обговорити проєкт',
      'hero.eyebrow': 'Бутикове digital-агентство',
      'hero.title1': 'ПРИВОДИМО', 'hero.title2': 'КЛІЄНТІВ.',
      'hero.sub': 'А не просто підписників',
      'hero.text': 'Поєднуємо Meta Ads, Google Ads і контент у систему, яка приводить заявки.',
      'hero.cta2': 'Дивитися кейси',
      'hero.location': 'Познань, Польща • Працюємо з клієнтами по всьому світу',
      'hero.scroll': 'Скрол',
      'manifesto.title': 'МИ — <span class="pink">SODO</span>.',
      'manifesto.lead': 'Бутикове агентство SMM, таргетованої та контекстної реклами. Даємо бізнесу рух через стратегію, креатив і системний маркетинг.',
      'manifesto.p1': 'Не робимо контент заради контенту.',
      'manifesto.p2': 'Не запускаємо рекламу навмання.',
      'manifesto.p3': 'Дивимося на цифри, продажі й те, що реально працює.',
      'services.label': '( 01 — 05 )', 'services.title': 'ПОСЛУГИ',
      'services.sub': 'Комплексно або окремими напрямами — залежить від задачі бізнесу.',
      'service.more': 'Детальніше',
      'service.meta.title': 'Meta Ads та Google Ads',
      'service.meta.desc': 'Запускаємо таргетовану та контекстну рекламу не заради кліків. Будуємо зв’язку, тестуємо гіпотези, аналізуємо цифри й оптимізуємо кампанії під заявки та продажі.',
      'service.smm.title': 'SMM',
      'service.smm.desc': 'Стратегія, контент і ведення соцмереж у єдиній системі. Щоб сторінка не просто виглядала активною, а формувала довіру й допомагала продавати.',
      'service.content.title': 'Контент і Reels',
      'service.content.desc': 'Ідеї, сценарії, зйомка та монтаж. Створюємо контент, який зупиняє скрол і нормально пояснює, чому клієнту варто обрати саме вас.',
      'service.branding.title': 'Брендинг',
      'service.branding.desc': 'Позиціонування, айдентика й візуальна система. Збираємо бренд, який можна впізнати без десяти пояснень.',
      'service.web.title': 'Сайти й лендінги',
      'service.web.desc': 'Створюємо швидкі й зрозумілі сайти, які підтримують рекламу, пояснюють продукт і ведуть користувача до заявки.',
      'cases.tag': 'Результати, а не красиві слова', 'cases.title': 'КЕЙСИ',
      'cases.sub': 'Реальні клієнти й напрями, з якими ми працюємо.',
      'cases.view': 'Переглянути кейс',
      'clients.lead': 'Нам довіряють',
      'process.tag': 'Як ми працюємо без хаосу', 'process.title': 'ЕТАПИ РОБОТИ',
      'process.sub': 'Від стратегії до масштабування — без хаосу і випадкових запусків.',
      'process.s1.title': 'Стратегія', 'process.s1.desc': 'Розбираємо продукт, аудиторію та точки росту',
      'process.s2.title': 'Запуск', 'process.s2.desc': 'Готуємо креативи та запускаємо Meta Ads і Google Ads',
      'process.s3.title': 'Контент', 'process.s3.desc': 'Створюємо контент, який прогріває та підсилює рекламу',
      'process.s4.title': 'Масштабування', 'process.s4.desc': 'Залишаємо сильні зв’язки та збільшуємо результат',
      'cta.eyebrow': 'Готові до руху?',
      'cta.title': 'Є ЗАДАЧА?<br>ДАВАЙТЕ <span class="pink">ОБГОВОРИМО</span>.',
      'cta.text': 'Розкажіть про бізнес і задачу — запропонуємо, з чого краще почати.',
      'form.name': 'Ім’я', 'form.name.ph': 'Ваше ім’я',
      'form.contact': 'Контакт', 'form.contact.ph': 'Telegram / Instagram / Email',
      'form.niche': 'Ніша або сфера бізнесу', 'form.niche.ph': 'Напр. барбершоп, e-commerce, ресторан',
      'form.err.name': 'Вкажіть ім’я',
      'form.err.contact': 'Вкажіть, як з вами зв’язатися',
      'form.err.niche': 'Опишіть коротко вашу нішу',
      'form.instagram': 'Instagram', 'form.telegram': 'Telegram',
      'form.sending': 'Надсилаємо…',
      'form.error': 'Не вдалося надіслати. Напишіть нам у Telegram або Instagram.',
      'form.success.title': 'Заявку надіслано',
      'form.success.text': 'Дякуємо! Зв’яжемося з вами найближчим часом. Якщо зручніше — напишіть нам напряму в Instagram або Telegram.',
      'footer.write': 'Написати нам',
      'footer.slogan': 'ДАЄМО<br>БІЗНЕСУ <span class="pink">РУХ</span>.',
      'footer.city': 'Познань, Польща',
      'footer.copy': '© 2026 SODO Agency', 'footer.privacy': 'Політика приватності'
    },
    pl: {
      'meta.title': 'SODO Agency — Meta Ads, Google Ads i SMM w Poznaniu',
      'meta.desc': 'Butikowa agencja digital SODO: Meta Ads, Google Ads, SMM, treści, branding i strony. Przyprowadzamy klientów, a nie tylko obserwujących — na całym świecie.',
      'a11y.skip': 'Przejdź do treści',
      'nav.services': 'Usługi', 'nav.cases': 'Case studies', 'nav.about': 'O nas', 'nav.process': 'Etapy', 'nav.contacts': 'Kontakt',
      'cta.discuss': 'Omówić projekt',
      'hero.eyebrow': 'Butikowa agencja digital',
      'hero.title1': 'ŚCIĄGAMY', 'hero.title2': 'KLIENTÓW.',
      'hero.sub': 'A nie tylko obserwujących',
      'hero.text': 'Łączymy Meta Ads, Google Ads i treści w system, który przynosi zgłoszenia.',
      'hero.cta2': 'Zobacz case studies',
      'hero.location': 'Poznań, Polska • Współpracujemy z klientami na całym świecie',
      'hero.scroll': 'Scroll',
      'manifesto.title': 'MY — <span class="pink">SODO</span>.',
      'manifesto.lead': 'Butikowa agencja SMM, reklamy targetowanej i kontekstowej. Dajemy biznesowi ruch przez strategię, kreację i systemowy marketing.',
      'manifesto.p1': 'Nie tworzymy treści dla samych treści.',
      'manifesto.p2': 'Nie uruchamiamy reklam na oślep.',
      'manifesto.p3': 'Patrzymy na liczby, sprzedaż i to, co naprawdę działa.',
      'services.label': '( 01 — 05 )', 'services.title': 'USŁUGI',
      'services.sub': 'Kompleksowo albo pojedynczymi kierunkami — zależnie od potrzeb biznesu.',
      'service.more': 'Więcej',
      'service.meta.title': 'Meta Ads i Google Ads',
      'service.meta.desc': 'Uruchamiamy reklamę targetowaną i kontekstową nie dla samych kliknięć. Budujemy lejek, testujemy hipotezy, analizujemy liczby i optymalizujemy kampanie pod zgłoszenia i sprzedaż.',
      'service.smm.title': 'SMM',
      'service.smm.desc': 'Strategia, treści i prowadzenie social mediów w jednym systemie. Aby profil nie tylko wyglądał aktywnie, ale budował zaufanie i pomagał sprzedawać.',
      'service.content.title': 'Treści i Reels',
      'service.content.desc': 'Pomysły, scenariusze, zdjęcia i montaż. Tworzymy treści, które zatrzymują scroll i konkretnie tłumaczą, dlaczego warto wybrać właśnie was.',
      'service.branding.title': 'Branding',
      'service.branding.desc': 'Pozycjonowanie, identyfikacja i system wizualny. Składamy markę, którą można rozpoznać bez dziesięciu wyjaśnień.',
      'service.web.title': 'Strony i landingi',
      'service.web.desc': 'Tworzymy szybkie i zrozumiałe strony, które wspierają reklamę, tłumaczą produkt i prowadzą użytkownika do zgłoszenia.',
      'cases.tag': 'Wyniki, a nie ładne słowa', 'cases.title': 'CASE STUDIES',
      'cases.sub': 'Realni klienci i kierunki, z którymi pracujemy.',
      'cases.view': 'Zobacz case study',
      'clients.lead': 'Zaufali nam',
      'process.tag': 'Jak pracujemy bez chaosu', 'process.title': 'ETAPY PRACY',
      'process.sub': 'Od strategii do skalowania — bez chaosu i przypadkowych startów.',
      'process.s1.title': 'Strategia', 'process.s1.desc': 'Analizujemy produkt, odbiorców i punkty wzrostu',
      'process.s2.title': 'Start', 'process.s2.desc': 'Tworzymy kreacje i uruchamiamy Meta Ads i Google Ads',
      'process.s3.title': 'Treści', 'process.s3.desc': 'Tworzymy treści, które podgrzewają i wzmacniają reklamę',
      'process.s4.title': 'Skalowanie', 'process.s4.desc': 'Zostawiamy mocne połączenia i zwiększamy wynik',
      'cta.eyebrow': 'Gotowi do ruchu?',
      'cta.title': 'MASZ ZADANIE?<br>POROZMAWIAJMY.',
      'cta.text': 'Opowiedz o biznesie i zadaniu — podpowiemy, od czego najlepiej zacząć.',
      'form.name': 'Imię', 'form.name.ph': 'Twoje imię',
      'form.contact': 'Kontakt', 'form.contact.ph': 'Telegram / Instagram / Email',
      'form.niche': 'Nisza lub branża', 'form.niche.ph': 'Np. barbershop, e-commerce, restauracja',
      'form.err.name': 'Podaj imię',
      'form.err.contact': 'Podaj, jak się z tobą skontaktować',
      'form.err.niche': 'Opisz krótko swoją niszę',
      'form.instagram': 'Instagram', 'form.telegram': 'Telegram',
      'form.sending': 'Wysyłamy…',
      'form.error': 'Nie udało się wysłać. Napisz do nas na Telegramie lub Instagramie.',
      'form.success.title': 'Zgłoszenie wysłane',
      'form.success.text': 'Dziękujemy! Odezwiemy się wkrótce. Jeśli wygodniej — napisz do nas bezpośrednio na Instagramie lub Telegramie.',
      'footer.write': 'Napisz do nas',
      'footer.slogan': 'DAJEMY<br>BIZNESOWI <span class="pink">RUCH</span>.',
      'footer.city': 'Poznań, Polska',
      'footer.copy': '© 2026 SODO Agency', 'footer.privacy': 'Polityka prywatności'
    }
  };

  /* =========================================================
     Helpers
     ========================================================= */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isDesktop = function () { return window.innerWidth > 900; };

  var LANGS = ['uk', 'pl'];
  var lang = 'uk';
  try { var saved = localStorage.getItem('sodo-lang'); if (LANGS.indexOf(saved) > -1) lang = saved; } catch (e) {}

  /* =========================================================
     Analytics
     ========================================================= */
  function track(event, extra) {
    var payload = { event: 'sodo_' + event };
    if (extra) for (var k in extra) payload[k] = extra[k];
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }
  function bindTracking() {
    $$('[data-track]').forEach(function (el) {
      el.addEventListener('click', function () { track(el.getAttribute('data-track')); });
    });
  }

  /* =========================================================
     i18n apply + language switch
     ========================================================= */
  function t(key) { return (I18N[lang] && I18N[lang][key] != null) ? I18N[lang][key] : (I18N.uk[key] || ''); }

  function applyI18n() {
    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      if (val == null) return;
      var attr = el.getAttribute('data-i18n-attr');
      if (attr) el.setAttribute(attr, val);
      else if (el.hasAttribute('data-i18n-html')) el.innerHTML = val;
      else el.textContent = val;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });
    document.documentElement.setAttribute('lang', lang === 'uk' ? 'uk' : 'pl');
    document.title = t('meta.title');
    $$('.lang button, .footer__lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  function setLang(next, animate) {
    if (LANGS.indexOf(next) < 0 || next === lang) return;
    lang = next;
    try { localStorage.setItem('sodo-lang', lang); } catch (e) {}
    var main = document.body;
    if (animate && !prefersReduced) {
      main.style.transition = 'opacity .18s ease';
      main.style.opacity = '0.55';
      setTimeout(function () {
        applyI18n(); renderCases();
        main.style.opacity = '1';
        setTimeout(function () { main.style.transition = ''; }, 220);
      }, 150);
    } else {
      applyI18n(); renderCases();
    }
    track('lang_switch', { lang: lang });
  }

  function bindLang() {
    $$('.lang button, .footer__lang button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
    });
  }

  /* =========================================================
     Render case studies
     ========================================================= */
  function renderCases() {
    var grid = $('#casesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    CASES.forEach(function (c, i) {
      var art = document.createElement('article');
      art.className = 'case reveal';
      if (i % 2 === 1) art.setAttribute('data-delay', '1');
      var stats = c.stats.map(function (s) {
        return '<li><b>' + s.v + '</b> ' + s.l[lang] + '</li>';
      }).join('');
      var note = c.note ? '<p class="case__note">' + c.note[lang] + '</p>' : '';
      var task = c.task ? '<p class="case__task">' + c.task[lang] + '</p>' : '';
      art.innerHTML =
        '<div class="case__top">' +
          '<span class="case__logo">' + c.logo + '</span>' +
          '<span class="case__niche">' + c.niche[lang] + '</span>' +
        '</div>' +
        task +
        '<ul class="case__stats">' + stats + '</ul>' +
        note;
      grid.appendChild(art);
    });
    // re-bind tracking + observe reveal for freshly-created nodes
    $$('#casesGrid [data-track]').forEach(function (el) {
      el.addEventListener('click', function () { track(el.getAttribute('data-track')); });
    });
    if (revealObserver) $$('#casesGrid .reveal').forEach(function (el) { revealObserver.observe(el); });
    else $$('#casesGrid .reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* =========================================================
     Mobile menu
     ========================================================= */
  var menu = $('#mobileMenu'), burger = $('#burger'), menuClose = $('#menuClose');
  var lastFocused = null;

  function focusables() { return $$('a[href], button:not([disabled])', menu); }

  function openMenu() {
    lastFocused = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
    var f = focusables(); if (f.length) f[0].focus();
    document.addEventListener('keydown', menuKeydown);
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', menuKeydown);
    if (lastFocused) lastFocused.focus();
  }
  function menuKeydown(e) {
    if (e.key === 'Escape') { closeMenu(); return; }
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  if (burger) burger.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  $$('.menu__nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* =========================================================
     Smooth scroll to anchors (with header offset)
     ========================================================= */
  function scrollToId(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 74;
    var y = target.getBoundingClientRect().top + window.pageYOffset - headerH - 8;
    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href === '#' || href.length < 2) { if (href === '#') e.preventDefault(); return; }
      var id = href.slice(1);
      if (document.getElementById(id)) {
        e.preventDefault();
        if (menu && menu.classList.contains('is-open')) closeMenu();
        scrollToId(id);
        history.replaceState(null, '', href);
      }
    });
  });

  /* =========================================================
     Header: glass on scroll + hide on scroll-down
     ========================================================= */
  var header = $('#siteHeader');
  var lastY = window.pageYOffset, ticking = false;
  function onScrollHeader() {
    var y = window.pageYOffset;
    if (header) {
      header.classList.toggle('is-scrolled', y > 20);
      var menuOpen = menu && menu.classList.contains('is-open');
      if (!menuOpen && y > 400 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 200) header.classList.remove('is-hidden');
    }
    lastY = y;
  }

  /* =========================================================
     Reveal on scroll
     ========================================================= */
  var revealObserver = null;
  function setupReveal() {
    if (!('IntersectionObserver' in window) || prefersReduced) {
      $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revealObserver.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el) { revealObserver.observe(el); });
  }

  /* =========================================================
     Hero intro
     ========================================================= */
  function heroIntro() {
    var hero = $('#hero');
    if (!hero) return;
    if (prefersReduced) { hero.classList.add('is-ready'); return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-ready'); }); });
  }

  /* =========================================================
     Magnetic buttons (desktop)
     ========================================================= */
  function setupMagnetic() {
    if (!canHover || prefersReduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      var raf = null;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.25;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.35;
        x = Math.max(-9, Math.min(9, x)); y = Math.max(-9, Math.min(9, y));
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'; });
      });
      el.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* =========================================================
     Parallax (desktop, rAF)
     ========================================================= */
  var parallaxEls = [];
  function setupParallax() {
    if (prefersReduced) return;
    parallaxEls = $$('[data-parallax]');
  }
  function updateParallax() {
    if (!parallaxEls.length || !isDesktop()) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.05;
      var delta = (r.top + r.height / 2) - vh / 2;
      el.style.transform = 'translate3d(0,' + (delta * speed).toFixed(1) + 'px,0)';
    });
  }

  /* =========================================================
     Process — reactive steps + stairs light
     ========================================================= */
  var procSteps = [], procVisual = null, procCurrent = -2;
  function setProcActive(i) {
    if (i === procCurrent) return;
    procCurrent = i;
    procSteps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    if (i >= 0) { procVisual.style.setProperty('--active', i); procVisual.classList.add('is-lit'); }
    else procVisual.classList.remove('is-lit');
  }
  function updateProcess() {
    if (!procSteps.length || !procVisual) return;
    var focus = window.innerHeight * 0.5, best = -1, bestD = Infinity, inView = false;
    procSteps.forEach(function (s, idx) {
      var r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      inView = true;
      var d = Math.abs((r.top + r.height / 2) - focus);
      if (d < bestD) { bestD = d; best = idx; }
    });
    setProcActive(inView ? best : -1);
  }
  function setupProcess() {
    procSteps = $$('.pstep');
    procVisual = $('#processVisual');
    if (!procSteps.length || !procVisual) return;
    if (canHover) {
      procSteps.forEach(function (s, idx) {
        s.addEventListener('mouseenter', function () { setProcActive(idx); });
      });
    }
    updateProcess();
  }

  /* =========================================================
     Unified scroll loop (header + parallax + process)
     ========================================================= */
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollHeader();
      updateParallax();
      updateProcess();
      ticking = false;
    });
  }

  /* =========================================================
     Lead form
     ========================================================= */
  function setupForm() {
    var form = $('#leadForm');
    if (!form) return;
    var status = $('#formStatus');
    var fields = $$('.field', form);

    function validateField(field) {
      var input = $('input, textarea', field);
      if (!input) return true;
      var ok = input.value.trim().length >= 2;
      field.classList.toggle('is-error', !ok);
      return ok;
    }
    fields.forEach(function (field) {
      var input = $('input, textarea', field);
      if (input) input.addEventListener('input', function () {
        if (field.classList.contains('is-error')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true, firstBad = null;
      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstBad) firstBad = $('input, textarea', field);
        valid = valid && ok;
      });
      if (!valid) { if (firstBad) firstBad.focus(); status.textContent = ''; return; }

      track('form_submit', { lang: lang });
      var data = {
        name: $('#f-name').value.trim(),
        contact: $('#f-contact').value.trim(),
        niche: $('#f-niche').value.trim(),
        lang: lang
      };

      function success() { form.classList.add('is-sent'); status.textContent = ''; track('lead', data); }

      if (!FORM_ENDPOINT) {
        // Demo mode — no backend configured.
        console.warn('[SODO] FORM_ENDPOINT is empty — showing demo success. Set it in js/main.js to receive real leads.');
        success();
        return;
      }
      status.className = 'form__status warn';
      status.textContent = t('form.sending');
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (r.ok) { success(); }
        else { status.className = 'form__status warn'; status.textContent = t('form.error'); }
      }).catch(function () {
        status.className = 'form__status warn'; status.textContent = t('form.error');
      });
    });
  }

  /* =========================================================
     Init
     ========================================================= */
  function init() {
    applyI18n();
    renderCases();
    setupReveal();
    bindLang();
    bindTracking();
    setupForm();
    setupMagnetic();
    setupParallax();
    setupProcess();
    heroIntro();
    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { updateParallax(); }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
