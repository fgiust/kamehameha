import type { ConjugationEngine, OptionFlags } from '../types';

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
    .replace(/<rt>.*?<\/rt>/g, '')
    .replace(/<\/?rb>/g, '')
    .replace(/<\/?ruby>/g, '');
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
