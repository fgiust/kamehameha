import type { SentenceItem } from '../types';

export type UiLang = 'en' | 'it';

export function resolveUiLang(language: string | undefined): UiLang {
  return (language ?? '').startsWith('it') ? 'it' : 'en';
}

/** Primary prompt for UI language; alternate is the other sentence line when present. */
export function getSentencePrompts(item: SentenceItem | undefined, lang: UiLang): { primary: string; alternate: string } {
  if (!item) return { primary: '', alternate: '' };

  const primary = lang === 'it' && item.italian ? item.italian : (item.english || '');
  const alternateRaw = lang === 'it' ? (item.english || '') : (item.italian || '');
  const alternate = alternateRaw.trim() && alternateRaw.trim() !== primary.trim() ? alternateRaw : '';

  return { primary, alternate };
}
