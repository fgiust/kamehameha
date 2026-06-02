import { generateAnswersFromTemplate } from './answers';
import { pickBestDiffFromTemplate } from './resolve';
import { renderDiffHtml } from './render';
import { matchesByRubyUnits } from './ruby';
import type { DiffOptions } from './options';
import { DEFAULT_DIFF_OPTIONS } from './options';
import type { DiffUnitOp } from './types';

export type GradeAnswerResult = {
  isCorrect: boolean;
  bestAnswer: string;
  ops: DiffUnitOp[];
  html: string;
};

export function gradeAnswer(
  user: string,
  answerTemplate: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): GradeAnswerResult {
  const alternatives = generateAnswersFromTemplate(answerTemplate, options);
  const trimmed = user.trim();
  const isCorrect = alternatives.some(a =>
    matchesByRubyUnits(trimmed, a, { allowNumericalAlternatives: options.allowNumericalAlternatives }),
  );
  const { bestAnswer, ops } = pickBestDiffFromTemplate(trimmed, answerTemplate, options);
  return {
    isCorrect,
    bestAnswer,
    ops,
    html: renderDiffHtml(ops),
  };
}
