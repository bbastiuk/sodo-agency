// Збирає /en/index.html і /pl/index.html з index.html і lang/*.json.
//
//   node scripts/build-lang.mjs
//
// Українська в index.html — джерело. Після будь-якої правки розмітки
// або перекладу запускати ще раз і комітити разом: en/ і pl/ — це
// готові сторінки з текстом усередині, щоб посилання, пошук і прев'ю
// в месенджерах бачили потрібну мову без жодного скрипта.
//
// Збірка падає, якщо в словнику бракує ключа, а в зібраній сторінці
// лишилась хоч одна кирилична літера поза коментарями й скриптами.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.sodoagency.eu';

const LANGS = {
  en: { locale: 'en_US', og: 'og-image-en.jpg' },
  pl: { locale: 'pl_PL', og: 'og-image-pl.jpg' },
};

const src = readFileSync(join(ROOT, 'index.html'), 'utf8');

const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => escText(s).replace(/"/g, '&quot;');

// **жирне** -> <b>, як render() у скрипті робив раніше
const rich = s => s.split('**').map((p, i) => (i % 2 ? `<b>${escText(p)}</b>` : escText(p))).join('');

function setAttr(tag, name, val) {
  const re = new RegExp(`(\\s${name}=")[^"]*(")`);
  if (!re.test(tag)) throw new Error(`немає ${name} у ${tag.slice(0, 80)}`);
  return tag.replace(re, (_, a, b) => a + escAttr(val) + b);
}

function sub(html, re, val, what) {
  if (!re.test(html)) throw new Error(`не знайдено: ${what}`);
  return html.replace(re, val);
}

function build(code) {
  const S = JSON.parse(readFileSync(join(ROOT, 'lang', `${code}.json`), 'utf8')).strings;
  const get = k => {
    if (!S[k]) throw new Error(`${code}: немає ключа ${k}`);
    return S[k];
  };
  const L = LANGS[code];
  const url = `${SITE}/${code}/`;
  let h = src;

  // ── голова ──
  h = sub(h, /<!-- Тільки на кореневій[\s\S]*?<script id="langGo">[\s\S]*?<\/script>\r?\n/, '', 'langGo');
  h = sub(h, /<html lang="uk">/, `<html lang="${code}">`, 'html lang');
  h = sub(h, /(<title>)[^<]*(<\/title>)/, `$1${escText(get('doc.title'))}$2`, 'title');
  h = sub(h, /(<meta name="description" content=")[^"]*/, `$1${escAttr(get('doc.desc'))}`, 'description');
  h = sub(h, /(<meta property="og:locale" content=")[^"]*/, `$1${L.locale}`, 'og:locale');
  h = sub(h, /(<meta property="og:title" content=")[^"]*/, `$1${escAttr(get('og.title'))}`, 'og:title');
  h = sub(h, /(<meta property="og:description" content=")[^"]*/, `$1${escAttr(get('og.desc'))}`, 'og:description');
  h = sub(h, /(<meta property="og:url" content=")[^"]*/, `$1${url}`, 'og:url');
  h = sub(h, /(<meta property="og:image" content=")[^"?]*og-image\.jpg/, `$1${SITE}/assets/images/${L.og}`, 'og:image');
  h = sub(h, /(<meta property="og:image:alt" content=")[^"]*/, `$1${escAttr(get('og.title'))}`, 'og:image:alt');
  h = sub(h, /(<link rel="canonical" href=")[^"]*/, `$1${url}`, 'canonical');
  // активна мова позначена ще до скрипта
  h = h.replace(/class="hd__lang-b is-on" ([^>]*?)aria-current="true"/, 'class="hd__lang-b" $1aria-current="false"');
  h = sub(h, new RegExp('class="hd__lang-b" ([^>]*?data-lang="' + code + '")'), 'class="hd__lang-b is-on" aria-current="true" $1', 'перемикач');
  // кирилиця цій сторінці не потрібна, а латинка — одразу
  h = h.replace(/(<link rel="preload" href="[^"]*?)-cyrillic(\.woff2")/g, '$1-latin$2');

  // ── атрибути ──
  h = h.replace(/<[a-zA-Z][^>]*\sdata-i18n-[a-z]+="[^>]*>/g, tag => {
    let m;
    if ((m = tag.match(/data-i18n-aria="([^"]+)"/))) tag = setAttr(tag, 'aria-label', get(m[1]));
    if ((m = tag.match(/data-i18n-ph="([^"]+)"/))) tag = setAttr(tag, 'placeholder', get(m[1]));
    if ((m = tag.match(/data-i18n-open="([^"]+)"/))) tag = setAttr(tag, 'data-open', get(m[1]));
    if ((m = tag.match(/data-i18n-close="([^"]+)"/))) tag = setAttr(tag, 'data-close', get(m[1]));
    if ((m = tag.match(/data-i18n-more="([^"]+)"/))) tag = setAttr(tag, 'data-more', get(m[1]));
    if ((m = tag.match(/data-i18n-less="([^"]+)"/))) tag = setAttr(tag, 'data-less', get(m[1]));
    return tag;
  });
  h = h.replace(/(data-i18n-open="([^"]+)"[^>]*>)[^<]*/g, (_, a, k) => a + escText(get(k)));
  h = h.replace(/(data-i18n-more="([^"]+)"[\s\S]*?>)<span>[^<]*<\/span>/g, (_, a, k) => `${a}<span>${escText(get(k))}</span>`);

  // ── текст вузлів ──
  // Збираємо всі [data-i18n] разом із межами вмісту й міняємо з кінця,
  // щоб зсуви не збивали ще не замінені місця.
  const hits = [];
  for (const m of h.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>/g)) {
    const tag = m[1];
    const from = m.index + m[0].length;
    const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'g');
    re.lastIndex = from;
    let depth = 1, end = -1, t;
    while ((t = re.exec(h))) {
      depth += t[0][1] === '/' ? -1 : 1;
      if (!depth) { end = t.index; break; }
    }
    if (end < 0) throw new Error(`не закрито <${tag} data-i18n="${m[2]}">`);
    hits.push({ from, end, key: m[2] });
  }
  hits.forEach((x, i) => {
    if (i && x.from < hits[i - 1].end) throw new Error(`вкладені data-i18n: ${hits[i - 1].key} / ${x.key}`);
  });
  for (const x of hits.reverse()) h = h.slice(0, x.from) + rich(get(x.key)) + h.slice(x.end);

  // ── перевірка: жодної кирилиці там, де її побачить людина ──
  const seen = h
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<style\b[\s\S]*?<\/style>/g, '');
  const left = seen.split(/\r?\n/).filter(l => /[Ѐ-ӿ]/.test(l));
  if (left.length) throw new Error(`${code}: лишилась кирилиця:\n${left.join('\n')}`);

  const nl = h.includes('\r\n') ? '\r\n' : '\n';
  h = h.replace(/<!doctype html>\r?\n/,
    `<!doctype html>${nl}<!-- Зібрано scripts/build-lang.mjs з index.html і lang/${code}.json. Руками не правити. -->${nl}`);

  mkdirSync(join(ROOT, code), { recursive: true });
  writeFileSync(join(ROOT, code, 'index.html'), h);
  console.log(`${code}/index.html  ${hits.length} вузлів`);
}

Object.keys(LANGS).forEach(build);
