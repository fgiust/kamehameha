import en from '../i18n/locales/en';
import it from '../i18n/locales/it';

export type SeoLang = 'en' | 'it';

export type SeoStrings = typeof en.seo;

const copies: Record<SeoLang, SeoStrings> = { en: en.seo, it: it.seo };

export function getSeoCopy(lang: SeoLang): SeoStrings {
  return copies[lang];
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}
