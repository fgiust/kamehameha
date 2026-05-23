import { describe, expect, it } from 'vitest';
import { negativeform, pastform, politeform, teform } from '../../src/engines/verbConjugation';

describe('verbConjugation', () => {
  it('te-form: godan く → いて', () => {
    expect(teform.getAnswer('書く', 'u', {})).toBe('書いて');
  });

  it('te-form: negative polite', () => {
    expect(teform.getAnswer('書く', 'u', { neg: true, polite: true })).toBe('書きませんで');
  });

  it('negative: godan short', () => {
    expect(negativeform.getAnswer('書く', 'u', {})).toBe('書かない');
  });

  it('negative: ある short', () => {
    expect(negativeform.getAnswer('ある', 'u', {})).toBe('ない');
  });

  it('past: godan polite', () => {
    expect(pastform.getAnswer('書く', 'u', { polite: true })).toBe('書きました');
  });

  it('polite: irregular する', () => {
    expect(politeform.getAnswer('する', 'irr', {})).toBe('します');
  });
});
