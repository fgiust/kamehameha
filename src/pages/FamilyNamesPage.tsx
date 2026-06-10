import { useTranslation } from 'react-i18next';
import ReadingExercise from '../components/ReadingExercise';
import { getReadingTxtLessonById } from '../lessons/readingTxtLessons';
import PageLayout from '../components/PageLayout';
import { useExercisePageMeta } from '../seo/useExercisePageMeta';

export default function FamilyNamesPage() {
  const { t } = useTranslation();
  const pageTitle = t('pages.familyNames.title');
  const pageMeta = useExercisePageMeta({ internalPath: '/family-names' });
  const lesson = getReadingTxtLessonById('reading-familynames');

  return (
    <PageLayout pageTitle={pageTitle} intro={pageMeta.intro}>
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
    </PageLayout>
  );
}
