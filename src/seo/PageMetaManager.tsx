import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildRuntimePageMeta } from './runtimeLessons';
import { stripLangPrefix } from './localizedPaths';
import type { SeoLang } from './seoCopy';
import { usePageMeta } from './usePageMeta';

export default function PageMetaManager() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = ((i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en') as SeoLang;
  const internalPath = stripLangPrefix(location.pathname);

  const meta = useMemo(
    () => buildRuntimePageMeta({ internalPath, lang }),
    [internalPath, lang],
  );

  usePageMeta(meta);
  return null;
}
