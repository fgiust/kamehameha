import { genkiLessons } from '../lessons/genkiLessons';
import { sentenceTxtLessons } from '../lessons/sentenceTxtLessons';
import { buildPageMeta as buildPageMetaCore, type PageMeta } from './siteMeta';
import type { SeoLang } from './seoCopy';

export function buildRuntimePageMeta(options: {
  internalPath: string;
  lang: SeoLang;
}): PageMeta {
  return buildPageMetaCore({
    ...options,
    genkiLessons,
    sentenceLessons: sentenceTxtLessons,
  });
}
