import ReadingExercise from '../components/ReadingExercise';
import { getReadingTxtLessonById } from '../lessons/readingTxtLessons';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import { useExercisePageMeta } from '../seo/useExercisePageMeta';

export default function DaysPage() {
  const { t } = useTranslation();
  const pageTitle = t('pages.days.title');
  const pageMeta = useExercisePageMeta({ internalPath: '/days' });
  const lesson = getReadingTxtLessonById('reading-days');

  return (
    <PageLayout pageTitle={pageTitle} intro={pageMeta.intro}>
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
