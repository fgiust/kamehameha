import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseAnswerTemplate } from '../engines/sentenceEngine';
import { validateAnswerTemplate } from '../utils/answerTemplateValidation';
import AnswerTemplateRuby from './AnswerTemplateRuby';

interface Props {
  template: string;
  className?: string;
}

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

  const rootClass = `answer-template-preview is-japanese ${className}`.trim();

  if (issues.length > 0) {
    return (
      <div className={`${rootClass} is-invalid`} role="status">
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
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return null;
  }

  return (
    <div className={rootClass} aria-label={t('answerTemplatePreview.label')}>
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
    </div>
  );
}
