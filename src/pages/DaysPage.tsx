import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReadingExercise from '../components/ReadingExercise';
import { getReadingTxtLessonById } from '../lessons/readingTxtLessons';
import { APP_TITLE_PREFIX } from '../types';
import { useTranslation } from 'react-i18next';

export default function DaysPage() {
  const { t, i18n } = useTranslation();
  const pageTitle = t('pages.days.title');
  useEffect(() => {
    document.title = APP_TITLE_PREFIX + pageTitle;
  }, [i18n.language]);
  const lesson = getReadingTxtLessonById('reading-days');

  return (
    <div className="app-container">
      <div className="page-actions">
        <Link to="/" className="header-btn" aria-label={t('common.back')}>&lt;</Link>
      </div>

      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
      </div>
      {lesson && (
        <ReadingExercise
          session={lesson}
          persistKey="/days"
          sectionTitle={pageTitle}
        />
      )}
    </div>
  );
}
