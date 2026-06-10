import { describe, expect, it } from 'vitest';
import { buildPageMeta, listPublicInternalPaths } from '../../src/seo/siteMeta';

describe('buildPageMeta', () => {
  it('builds English home meta', () => {
    const meta = buildPageMeta({ internalPath: '/', lang: 'en' });
    expect(meta.title).toContain('kamehameha');
    expect(meta.description).toMatch(/Genki/i);
    expect(meta.canonical).toBe('https://kamehameha.fgiust.com/');
    expect(meta.hreflangAlternates).toHaveLength(3);
  });

  it('builds Italian home meta with /it/ canonical', () => {
    const meta = buildPageMeta({ internalPath: '/', lang: 'it' });
    expect(meta.lang).toBe('it');
    expect(meta.canonical).toBe('https://kamehameha.fgiust.com/it/');
    expect(meta.title).toMatch(/grammatica giapponese/i);
  });

  it('builds Genki exercise meta for genki5-2', () => {
    const meta = buildPageMeta({
      internalPath: '/genki/genki5-2',
      lang: 'en',
      genkiLessons: [{
        id: 'genki5-2',
        title: '好き/きらい(な)',
        titleItalian: '好き/きらい(な)',
        sentenceData: [],
      }],
    });
    expect(meta.documentTitle).toBe('好き/きらい(な)');
    expect(meta.title).toContain('好き/きらい(な)');
    expect(meta.title).toMatch(/Genki Lesson 5/i);
    expect(meta.og.title).toBe(meta.title);
    expect(meta.description).toMatch(/Genki Lesson 5/i);
    expect(meta.canonical).toBe('https://kamehameha.fgiust.com/genki/genki5-2');
  });

  it('builds te-form conjugation meta', () => {
    const meta = buildPageMeta({ internalPath: '/teform', lang: 'en' });
    expect(meta.documentTitle).toBe('て-Form');
    expect(meta.title).toMatch(/て-Form/i);
    expect(meta.title).toContain('kamehameha');
    expect(meta.description).toMatch(/verb conjugation/i);
  });

  it('lists public paths including genki and static pages', () => {
    const paths = listPublicInternalPaths(
      [{ id: 'genki1-1', title: 'X', sentenceData: [] }],
      [{ id: 'sentence-test', title: 'Y', sentenceData: [] }],
    );
    expect(paths).toContain('/');
    expect(paths).toContain('/genki/genki1-1');
    expect(paths).toContain('/sentence/sentence-test');
    expect(paths).toContain('/teform');
    expect(paths).toContain('/disclaimer');
    expect(paths).toContain('/contact');
  });
});
