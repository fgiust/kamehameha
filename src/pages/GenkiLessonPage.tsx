import { useParams } from 'react-router-dom';
import SentenceExercise from '../components/SentenceExercise';
import { getGenkiLessonById } from '../data/genkiLessons';

export default function GenkiLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getGenkiLessonById(lessonId) : undefined;

  if (!lesson) {
    return (
      <div className="app-container">
        <h1 className="page-heading">Lesson not found: {lessonId}</h1>
        <p>This lesson has not been implemented yet.</p>
      </div>
    );
  }

  return (
    <SentenceExercise
      key={lesson.id}
      title={lesson.title}
      sentenceData={lesson.sentenceData}
      backPath="/"
      persistKey={`/genki/${lesson.id}`}
    />
  );
}
