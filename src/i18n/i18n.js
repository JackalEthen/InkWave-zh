// Tiny runtime translator. Loaded by every UI module; nothing here imports the game.
// A dictionary is `{ en: { key: value }, zh: { key: value } }`; values can hold {name} placeholders.

import { DICT } from './dict.js';

const FALLBACK = 'en';
const STORE_KEY = 'inkwave.lang';

export const LANGS = [
  { id: 'zh', label: '中文' },
  { id: 'en', label: 'English' },
];

let _lang = FALLBACK;
const _listeners = new Set();

const read = (lang, key) => {
  const table = DICT[lang];
  const v = table && table[key];
  return typeof v === 'string' ? v : null;
};

// t('hud.splatted', { name: 'Mint' }) -> '被 Mint 泼了一脸' / 'Splatted by Mint'
export function t(key, vars) {
  let s = read(_lang, key);
  if (s === null) s = read(FALLBACK, key);
  if (s === null) {
    if (typeof console !== 'undefined') console.warn('[i18n] missing key:', key);
    return key;
  }
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));
}

// Pick the localized variant of an inline object: L({ en: 'DONE', zh: '穿上' }).
// Returns the active language, then English, then whatever exists.
export const L = (obj) => (obj && (obj[_lang] !== undefined ? obj[_lang] : obj[FALLBACK])) || '';

export const lang = () => _lang;

export function setLang(next) {
  const l = DICT[next] ? next : FALLBACK;
  if (l === _lang) return;
  _lang = l;
  try { localStorage.setItem(STORE_KEY, l); } catch { /* private mode */ }
  const html = typeof document !== 'undefined' && document.documentElement;
  if (html) html.lang = l === 'zh' ? 'zh-Hans' : 'en';
  for (const fn of _listeners) fn(l);
}

export function onLangChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Persisted choice wins; otherwise Chinese, per the project default.
export function initLang() {
  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch { /* private mode */ }
  _lang = DICT[saved] ? saved : 'zh';
  const html = typeof document !== 'undefined' && document.documentElement;
  if (html) html.lang = _lang === 'zh' ? 'zh-Hans' : 'en';
  // Let modules that translated at import time (before this ran) rebuild their labels.
  for (const fn of _listeners) fn(_lang);
  return _lang;
}