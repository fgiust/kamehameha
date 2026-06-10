import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildRuntimePageMeta } from './runtimeLessons';
import { stripLangPrefix } from './localizedPaths';
import type { SeoLang } from './seoCopy';

export function useExercisePageMeta(overrides?: { internalPath?: string }) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = ((i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en') as SeoLang;
  const internalPath = overrides?.internalPath ?? stripLangPrefix(location.pathname);

  return useMemo(
    () => buildRuntimePageMeta({ internalPath, lang }),
    [internalPath, lang],
  );
}
