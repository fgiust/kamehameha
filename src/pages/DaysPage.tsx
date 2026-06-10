import ReadingExercise from '../components/ReadingExercise';
import { getReadingTxtLessonById } from '../lessons/readingTxtLessons';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';

export default function DaysPage() {
  const { t } = useTranslation();
  const pageTitle = t('pages.days.title');
  const lesson = getReadingTxtLessonById('reading-days');

  return (
    <PageLayout pageTitle={pageTitle}>
      {lesson && (
        <ReadingExercise
          session={lesson}
          persistKey="/days"
          sectionTitle={pageTitle}
        />
      )}
    </PageLayout>
  );
}
