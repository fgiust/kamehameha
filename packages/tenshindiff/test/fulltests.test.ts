import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diffSentenceAnswer } from '../src/diff';
import { generateAnswersFromTemplate } from '../src/answers';
import { validationRowFromOps } from '../src/fulltestCase';
import { pickBestDiffFromTemplate } from '../src/resolve';
import { matchesByRubyUnits } from '../src/ruby';

type FullDiffCase = {
  name: string;
  expectedExpression: string;
  userAnswer: string;
  expectedShownOutput: string;
  expectedValidationRow: string;
};

function parseFullDiffCases(input: string): FullDiffCase[] {
  const lines = input.split(/\r?\n/);
  const cleaned = lines
    .filter(line => line.trim().length > 0)
    .filter(line => !line.trim().startsWith('//'));
  const cases: FullDiffCase[] = [];

  for (let i = 0; i < cleaned.length; i += 5) {
    const chunk = cleaned.slice(i, i + 5);
    if (chunk.length < 5) {
      throw new Error(`Invalid fulltests format: trailing incomplete block at line ${i + 1}`);
    }

    const name = chunk[0]!;
    const expectedExpression = chunk[1]!;
    const userAnswer = chunk[2]!;
    const expectedShownOutput = chunk[3]!;
    const expectedValidationRow = chunk[4]!;

    cases.push({
      name,
      expectedExpression,
      userAnswer,
      expectedShownOutput,
      expectedValidationRow,
    });
  }

  return cases;
}

function shownOutputFromOps(ops: ReturnType<typeof diffSentenceAnswer>): string {
  return ops
    .map(op => {
      if (op.kind === 'extra') return op.text;
      if (op.unit.kind === 'plain') return op.unit.surface;
      return `${op.unit.surface}[${op.unit.reading}]`;
    })
    .join('');
}

function assertValidationRowFormat(shownOutput: string, validationRow: string): void {
  const expectedCorrect = validationRow.endsWith('✅');
  const expectedInvalid = validationRow.endsWith('❌');
  if (!expectedCorrect && !expectedInvalid) {
    throw new Error(`Validation row must end with ✅ or ❌: ${validationRow}`);
  }

  const markerBody = validationRow.slice(0, -1);
  expect(Array.from(markerBody)).toHaveLength(Array.from(shownOutput).length);

  const shownChars = Array.from(shownOutput);
  const markerChars = Array.from(markerBody);
  for (let i = 0; i < shownChars.length; i++) {
    const outCh = shownChars[i]!;
    const markerCh = markerChars[i]!;
    if (outCh === '[' || outCh === ']') {
      expect(markerCh).toBe(outCh);
      continue;
    }
    expect(/^[・ー＋＝]$/.test(markerCh)).toBe(true);
  }
}

describe('fulltests data format', () => {
  const dataPath = join(import.meta.dirname, 'data/fulltests.txt');
  const raw = readFileSync(dataPath, 'utf8');
  const cases = parseFullDiffCases(raw);

  it('parses at least one full diff case', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const testCase of cases) {
    it(testCase.name.replace(/^#\s*/, ''), () => {
      const alternatives = generateAnswersFromTemplate(testCase.expectedExpression);
      const isCorrect = alternatives.some(a => matchesByRubyUnits(testCase.userAnswer, a));
      const { ops } = pickBestDiffFromTemplate(testCase.userAnswer, testCase.expectedExpression);

      expect(shownOutputFromOps(ops)).toBe(testCase.expectedShownOutput);
      expect(validationRowFromOps(ops, isCorrect)).toBe(testCase.expectedValidationRow);
      assertValidationRowFormat(testCase.expectedShownOutput, testCase.expectedValidationRow);
      expect(testCase.expectedValidationRow.endsWith('✅')).toBe(isCorrect);
    });
  }
});
