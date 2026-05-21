import type { ConjugationEngine, OptionFlags } from '../types';
import type { TFunction } from 'i18next';

export function readStoredBool(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === 'true';
  } catch {
    return fallback;
  }
}

export function writeStoredBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    return;
  }
}

export function stripRubyTags(input: string) {
  return input
    .replace(/<rt[^>]*>[\s\S]*?<\/rt>/g, '')
    .replace(/<\/?rb[^>]*>/g, '')
    .replace(/<\/?ruby[^>]*>/g, '')
    .replace(/\[([^\]]*)\]/g, '');
}

export function toRubyInnerHtml(text: string) {
  return text.replace(/([^[\]]+?)\[([^\]]*)\]/g, (_m, surface: string, reading: string) => `${surface}<rt>${reading}</rt>`);
}

export function toKanaReading(text: string) {
  const normalized = text
    .replace(/<rt[^>]*>([\s\S]*?)<\/rt>/g, (_m, reading: string) => `[${reading}]`)
    .replace(/<\/?rb[^>]*>/g, '')
    .replace(/<\/?ruby[^>]*>/g, '');

  let out = '';
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]!;
    if (ch === '[') {
      const end = normalized.indexOf(']', i + 1);
      if (end === -1) continue;
      out += normalized.slice(i + 1, end);
      i = end;
      continue;
    }
    if (/[\u3040-\u309F\u30A0-\u30FFー]/.test(ch)) {
      out += ch;
    }
  }
  return out;
}

export function pickRandomSubset<T>(items: T[], maxSize: number) {
  const n = Math.max(0, Math.min(items.length, Math.floor(maxSize)));
  if (n >= items.length) return items;
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j]!;
    out[j] = tmp!;
  }
  return out.slice(0, n);
}

export function getConjugationFormHint(engine: ConjugationEngine, flags: OptionFlags) {
  const base = engine.baseFormHint ?? 'plain';
  const hasNegOpt = engine.opts.some(o => o.id === 'neg');
  const hasPoliteOpt = engine.opts.some(o => o.id === 'polite');

  const isNeg = base === 'negative' || (hasNegOpt && !!flags.neg);
  const isPolite = base === 'polite' || (hasPoliteOpt && !!flags.polite);
  const isPlain = !isNeg && !isPolite;

  const parts: string[] = [];
  for (const o of engine.opts) {
    if (o.id === 'neg' || o.id === 'polite') continue;
    if (flags[o.id]) parts.push(o.label.toLowerCase());
  }
  if (isPlain) parts.push('plain');
  if (isNeg) parts.push('negative');
  if (isPolite) parts.push('polite');
  parts.push('form');
  return parts.join(' ');
}

export function getConjugationFormHintLocalized(t: TFunction, engine: ConjugationEngine, flags: OptionFlags) {
  const base = engine.baseFormHint ?? 'plain';
  const hasNegOpt = engine.opts.some(o => o.id === 'neg');
  const hasPoliteOpt = engine.opts.some(o => o.id === 'polite');

  const isNeg = base === 'negative' || (hasNegOpt && !!flags.neg);
  const isPolite = base === 'polite' || (hasPoliteOpt && !!flags.polite);
  const isPlain = !isNeg && !isPolite;

  const parts: string[] = [];
  for (const o of engine.opts) {
    if (o.id === 'neg' || o.id === 'polite') continue;
    if (!flags[o.id]) continue;
    parts.push(t(`conjugationHint.opts.${o.id}`));
  }
  if (isPlain) parts.push(t('conjugationHint.plain'));
  if (isNeg) parts.push(t('conjugationHint.negative'));
  if (isPolite) parts.push(t('conjugationHint.polite'));

  return t('conjugationHint.template', { parts: parts.join(' ') });
}
