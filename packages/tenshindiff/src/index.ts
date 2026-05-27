export type { RubyUnit, DiffUnitOp } from './types';
export type { GradeAnswerResult } from './grade';
export type { RenderDiffHtmlOptions } from './render';

export { stripRuby, toKana, parseRubyUnits, matchesByRubyUnits } from './ruby';
export {
  parseAnswerTemplate,
  generateAnswers,
  primarySurfaceFromTemplate,
  pickBestAnswerForDisplay,
} from './template';
export { diffSentenceAnswer, pickBestDiff, countMatchedChars } from './diff';
export { formatDiffPlainText } from './plain';
export { renderDiffHtml } from './render';
export { gradeAnswer } from './grade';
