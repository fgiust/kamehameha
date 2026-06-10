import { describe, expect, it } from 'vitest';
import { stripLangPrefix } from '../../src/seo/localizedPaths';

describe('stripLangPrefix', () => {
  it('strips /it prefix from exercise paths', () => {
    expect(stripLangPrefix('/it/negativeform')).toBe('/negativeform');
    expect(stripLangPrefix('/it/teform')).toBe('/teform');
    expect(stripLangPrefix('/negativeform')).toBe('/negativeform');
  });

  it('normalizes italian home', () => {
    expect(stripLangPrefix('/it')).toBe('/');
    expect(stripLangPrefix('/it/')).toBe('/');
  });
});
