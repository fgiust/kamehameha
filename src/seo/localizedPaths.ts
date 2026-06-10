import type { AppLanguage } from '../i18n/index';

const IT_PREFIX = '/it';

/** Strip /it prefix to get the canonical internal path (always starts with /). */
export function stripLangPrefix(pathname: string): string {
  if (pathname === IT_PREFIX) return '/';
  if (pathname.startsWith(`${IT_PREFIX}/`)) {
    return pathname.slice(IT_PREFIX.length) || '/';
  }
  return pathname || '/';
}

export function getLanguageFromPathname(pathname: string): AppLanguage | null {
  if (pathname === IT_PREFIX || pathname.startsWith(`${IT_PREFIX}/`)) return 'it';
  return null;
}

/** Build a localized URL path for the given internal path and language. */
export function localizePath(internalPath: string, lang: AppLanguage): string {
  const normalized = internalPath.startsWith('/') ? internalPath : `/${internalPath}`;
  if (lang === 'it') {
    return normalized === '/' ? `${IT_PREFIX}/` : `${IT_PREFIX}${normalized}`;
  }
  return normalized;
}

export function localizeHref(path: string, lang: AppLanguage): string {
  const [pathname, search = ''] = path.split('?');
  const localized = localizePath(pathname, lang);
  return search ? `${localized}?${search}` : localized;
}
