import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  validateAnswerTemplate,
  type AnswerTemplateIssue,
} from 'tenshindiff/validate';

interface Props {
  value: string;
  showIssues?: boolean;
}

function issueKey(issue: AnswerTemplateIssue, index: number): string {
  return `${issue.code}-${issue.index ?? 'x'}-${index}`;
}

export default function AnswerTemplateValidation({ value, showIssues = true }: Props) {
  const { t } = useTranslation();
  const issues = useMemo(() => validateAnswerTemplate(value), [value]);

  if (!showIssues || issues.length === 0) return null;

  return (
    <ul className="answer-template-validation" role="list">
      {issues.map((issue, i) => (
        <li key={issueKey(issue, i)}>
          {t(`sentenceEdit.validation.${issue.code}`, {
            defaultValue: issue.message,
            message: issue.message,
          })}
        </li>
      ))}
    </ul>
  );
}

export function useAnswerTemplateIssues(value: string): AnswerTemplateIssue[] {
  return useMemo(() => validateAnswerTemplate(value), [value]);
}
