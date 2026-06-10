import { useLocation, useParams } from 'react-router-dom';
import { getSentenceTxtLessonById } from '../lessons/sentenceTxtLessons';
import SentenceExercise from '../components/SentenceExercise';
import { useTranslation } from 'react-i18next';
import { stripLangPrefix } from '../seo/localizedPaths';

export default function SentenceTxtLessonPage() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const lessonId = params.lessonId ?? '';
  const persistKey = stripLangPrefix(location.pathname);

  const lesson = getSentenceTxtLessonById(lessonId);
  if (!lesson) {
    return <SentenceExercise title="Sentence Exercise" sentenceData={[]} persistKey={persistKey} />;
  }

  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const title = lang === 'it' ? (lesson.titleItalian ?? lesson.title) : lesson.title;

  return (
    <SentenceExercise
      title={title}
      sentenceData={lesson.sentenceData}
      persistKey={persistKey}
      dataLessonId={lesson.id}
    />
  );
}
