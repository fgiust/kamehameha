import { useParams } from 'react-router-dom';
import SentenceExercise from '../components/SentenceExercise';
import { getGenkiLessonById } from '../lessons/genkiLessons';
import { useTranslation } from 'react-i18next';

export default function GenkiLessonPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getGenkiLessonById(lessonId) : undefined;

  if (!lesson) {
    return (
      <div className="app-container">
        <h1 className="page-heading">{t('genkiLessonPage.notFoundTitle', { id: lessonId })}</h1>
        <p>{t('genkiLessonPage.notFoundBody')}</p>
      </div>
    );
  }

  return (
    <SentenceExercise
      key={lesson.id}
      title={lang === 'it' ? (lesson.titleItalian ?? lesson.title) : lesson.title}
      sentenceData={lesson.sentenceData}
      backPath="/"
      persistKey={`/genki/${lesson.id}`}
    />
  );
}
