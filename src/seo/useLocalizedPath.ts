import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../i18n/index';
import { localizeHref, localizePath } from './localizedPaths';

export function useAppLanguage(): AppLanguage {
  const { i18n } = useTranslation();
  return (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
}

export function useLocalizedPath() {
  const lang = useAppLanguage();
  return useCallback(
    (path: string) => localizePath(path, lang),
    [lang],
  );
}

export function useLocalizedHref() {
  const lang = useAppLanguage();
  return useCallback(
    (href: string) => localizeHref(href, lang),
    [lang],
  );
}
