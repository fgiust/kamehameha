import { useTranslation } from 'react-i18next';

type Props = {
  visible?: boolean;
};

/** Full answer-banner replacement when an incorrect answer is undone. */
export default function AnswerUndoneBanner({ visible = true }: Props) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <div className="answer-banner is-undone" role="status" aria-live="polite">
      {t('common.answerUndone')}
    </div>
  );
}
