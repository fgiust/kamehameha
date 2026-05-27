import { pickBestDiff } from './diff';
import { renderDiffHtml } from './render';
import { matchesByRubyUnits } from './ruby';
import { generateAnswers, parseAnswerTemplate } from './template';
import type { DiffUnitOp } from './types';

export type GradeAnswerResult = {
  isCorrect: boolean;
  bestAnswer: string;
  ops: DiffUnitOp[];
  html: string;
};

export function gradeAnswer(user: string, answerTemplate: string): GradeAnswerResult {
  const alternatives = generateAnswers(parseAnswerTemplate(answerTemplate));
  const trimmed = user.trim();
  const isCorrect = alternatives.some(a => matchesByRubyUnits(trimmed, a));
  const { bestAnswer, ops } = pickBestDiff(trimmed, alternatives);
  return {
    isCorrect,
    bestAnswer,
    ops,
    html: renderDiffHtml(ops),
  };
}
