# SODO Agency — signal-world website

Одноекранний інтерактивний сайт SODO у стилі **signal / CRT / digital editorial**.

Сайт побудований не як довгий типовий лендинг, а як один основний fullscreen-досвід з окремими повноекранними станами для послуг, робіт, інформації про агенцію та контакту.

## Стек

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts: Unbounded + Manrope
- без build step
- готово для GitHub Pages

## Основна структура

- custom loader: `SEARCHING FOR SIGNAL → SIGNAL FOUND`
- fullscreen hero
- інтерактивний CRT / signal object
- ambient motion і реакція на курсор
- custom signal transition між станами
- fullscreen overlays:
  - Роботи
  - Послуги
  - Про нас
  - Контакт
- fullscreen mobile menu
- `prefers-reduced-motion`
- keyboard focus trap для dialog states
- no-JS static hero fallback

## Файли

```
index.html
css/style.css
js/main.js
assets/
```

Сайт не потребує npm, bundler або build-команди.

## GitHub Pages

Публікація розрахована на:

- branch: `main`
- folder: `/ (root)`

Основна адреса:

`https://bbastiuk.github.io/sodo-agency/`

## Контактна форма

Форма зараз працює без стороннього backend: після валідації формує email через `mailto:hello@sodo.agency`.

Також у contact screen є прямі переходи в Instagram і Telegram.

Якщо пізніше буде потрібна серверна відправка заявок без відкриття поштового клієнта, форму можна підключити до Formspree, власного API або CRM webhook.

## Роботи

На сайті показано тільки два selected work:

- UMI
- Razeb Studio

Візуальні композиції всередині cards позначені як **DEMO COMPOSITION**, якщо це не реальний клієнтський asset.

Жодних вигаданих метрик, ROAS, відгуків або результатів у сайт не закладено.

## Візуальна система

- black / white / SODO pink
- великий масштаб
- мінімум декоративного шуму
- CRT / signal як єдина візуальна метафора
- motion як частина композиції, а не набір fade-in ефектів

## Mobile

Окремо адаптовано hero, overlays і navigation для вузьких та коротких екранів.

На touch-device прибрано desktop cursor effects.

## Accessibility

- semantic dialog roles
- keyboard focus management
- visible focus states
- reduced-motion mode
- static fallback без animation
