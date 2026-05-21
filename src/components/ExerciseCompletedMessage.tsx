import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ExerciseCompletedMessage() {
  const { t } = useTranslation();

  return (
    <div className="exercise-completed">
      <div className="exercise-completed-title">{t('exerciseCompleted.title')}</div>
      <div className="exercise-completed-subtitle">{t('exerciseCompleted.subtitle')}</div>
      <div className="exercise-completed-body">
        <div>{t('exerciseCompleted.body1')}</div>
        <div>{t('exerciseCompleted.body2')}</div>
      </div>
      <Link to="/" state={{ restoreScroll: true }} className="exercise-completed-link">{t('exerciseCompleted.cta')}</Link>
    </div>
  );
}
