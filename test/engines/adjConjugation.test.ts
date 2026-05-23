import { describe, expect, it } from 'vitest';
import { adjNegativeform, adjNaruform, adjPastform } from '../../src/engines/adjConjugation';

describe('adjConjugation', () => {
  it('i-adjective negative short', () => {
    expect(adjNegativeform.getAnswer('高い', 'i', {})).toBe('高くない');
  });

  it('na-adjective negative short', () => {
    const ans = adjNegativeform.getAnswer('静か', 'na', {});
    expect(Array.isArray(ans) ? ans : [ans]).toContain('静かじゃない');
  });

  it('i-adjective past polite', () => {
    const ans = adjPastform.getAnswer('高い', 'i', { polite: true });
    expect(Array.isArray(ans) ? ans[0] : ans).toBe('高かったです');
  });

  it('na-adjective naru', () => {
    expect(adjNaruform.getAnswer('静か', 'na', {})).toBe('静かになる');
  });
});
