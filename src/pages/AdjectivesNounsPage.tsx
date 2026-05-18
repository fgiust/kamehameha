import SentenceExercise from '../components/SentenceExercise';
import { adjectivesNounsSentenceData } from '../data/adjectivesNouns';

export default function AdjectivesNounsPage() {
  return <SentenceExercise title="Adjectives + nouns" sentenceData={adjectivesNounsSentenceData} backPath="/" persistKey="/adjectives-nouns" />;
}
