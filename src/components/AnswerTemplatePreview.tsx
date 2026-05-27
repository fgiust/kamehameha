import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseAnswerTemplate } from 'tenshindiff';
import { validateAnswerTemplate } from 'tenshindiff/validate';
import AnswerTemplateRuby from './AnswerTemplateRuby';

interface Props {
  template: string;
  className?: string;
}

/**
 * Live answer-template preview. The outer box always keeps a fixed min-height so
 * switching between valid preview / errors / empty never shifts layout (no CLS).
 */
export default function AnswerTemplatePreview({ template, className = '' }: Props) {
  const { t } = useTranslation();
  const issues = useMemo(() => validateAnswerTemplate(template), [template]);
  const parts = useMemo(() => {
    if (issues.length > 0) return null;
    try {
      return parseAnswerTemplate(template);
    } catch {
      return null;
    }
  }, [template, issues.length]);

  const rootClass = `answer-template-preview is-japanese ${issues.length > 0 ? 'is-invalid' : ''} ${className}`.trim();

  return (
    <div
      className={rootClass}
      role={issues.length > 0 ? 'status' : undefined}
      aria-label={issues.length === 0 && parts ? t('answerTemplatePreview.label') : undefined}
    >
      {issues.length > 0 ? (
        <ul className="answer-template-preview-errors">
          {issues.map((issue, i) => (
            <li key={`${issue.code}-${issue.index ?? i}`}>
              {t(`sentenceEdit.validation.${issue.code}`, {
                defaultValue: issue.message,
                message: issue.message,
              })}
            </li>
          ))}
        </ul>
      ) : parts && parts.length > 0 ? (
        <>
          {parts.map((part, i) => {
            if (typeof part === 'string') {
              return (
                <span key={i} className="answer-template-segment">
                  <AnswerTemplateRuby text={part} />
                </span>
              );
            }
            return (
              <span key={i} className="answer-template-alt-group">
                {part.map((alt, j) => (
                  <span key={j} className="answer-template-alt-option">
                    {j > 0 && <span className="answer-template-alt-sep">|</span>}
                    <AnswerTemplateRuby text={alt} />
                  </span>
                ))}
              </span>
            );
          })}
        </>
      ) : null}
    </div>
  );
}
