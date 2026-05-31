export type { RubyUnit, DiffUnitOp } from './types';
export type { GradeAnswerResult } from './grade';
export type { RenderDiffHtmlOptions } from './render';
export type { DiffOptions } from './options';
export { DEFAULT_DIFF_OPTIONS, applyTemplateDiffOptions, applyCommasAsOptional, applyIgnoreTrailingPunctuation } from './options';
export { generateAnswersFromTemplate } from './answers';

export { stripRuby, toKana, parseRubyUnits, matchesByRubyUnits } from './ruby';
export {
  parseAnswerTemplate,
  generateAnswers,
  primarySurfaceFromTemplate,
  pickBestAnswerForDisplay,
} from './template';
export { diffSentenceAnswer, pickBestDiff, countMatchedChars } from './diff';
export {
  pickBestDiffFromTemplate,
  resolveAnswerFromTemplate,
  resolveAnswerFromParts,
  pickSegmentAlternative,
  scoreSegmentAt,
} from './resolve';
export { formatDiffPlainText } from './plain';
export { renderDiffHtml } from './render';
export { gradeAnswer } from './grade';
