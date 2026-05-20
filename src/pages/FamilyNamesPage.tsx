import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReadingExercise from '../components/ReadingExercise';
import { getReadingTxtLessonById } from '../lessons/readingTxtLessons';
import { APP_TITLE_PREFIX } from '../types';
import BackButton from '../components/BackButton';

export default function FamilyNamesPage() {
  const { t, i18n } = useTranslation();
  const pageTitle = t('pages.familyNames.title');
  useEffect(() => {
    document.title = APP_TITLE_PREFIX + pageTitle;
  }, [i18n.language, pageTitle]);
  const lesson = getReadingTxtLessonById('reading-familynames');

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
        <div className="page-actions">
          <BackButton fallbackTo="/" />
        </div>
      </div>
      {lesson && (
        <ReadingExercise
          session={lesson}
          persistKey="/family-names"
          sectionTitle={pageTitle}
          acceptQuestionAsCorrect
          showPreviousAnswers
          largeAnswer
        />
      )}
    </div>
  );
}
