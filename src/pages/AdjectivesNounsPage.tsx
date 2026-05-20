import SentenceExercise from '../components/SentenceExercise';
import { getSentenceTxtLessonById } from '../data/sentenceTxtLessons';
import { useTranslation } from 'react-i18next';

export default function AdjectivesNounsPage() {
  const { i18n } = useTranslation();
  const lesson = getSentenceTxtLessonById('sentence-adjectivenouns');
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';

  if (!lesson) {
    return <SentenceExercise title="Sentence Exercise" sentenceData={[]} backPath="/" persistKey="/adjectives-nouns" />;
  }

  const title = lang === 'it' ? (lesson.titleItalian ?? lesson.title) : lesson.title;
  return <SentenceExercise title={title} sentenceData={lesson.sentenceData} backPath="/" persistKey="/adjectives-nouns" />;
}
