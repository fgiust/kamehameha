import { applyTemplateDiffOptions, type DiffOptions, DEFAULT_DIFF_OPTIONS } from './options';
import { generateAnswers, parseAnswerTemplate } from './template';

/** Parse a template and expand all answer alternatives, applying optional diff flags first. */
export function generateAnswersFromTemplate(
  template: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): string[] {
  const prepared = applyTemplateDiffOptions(template, options);
  return generateAnswers(parseAnswerTemplate(prepared));
}
