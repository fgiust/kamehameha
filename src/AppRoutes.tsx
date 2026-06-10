import { Navigate, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GenkiLessonPage from './pages/GenkiLessonPage';
import VerbExercisePage from './pages/VerbExercisePage';
import AdjExercisePage from './pages/AdjExercisePage';
import RandomizePage from './pages/RandomizePage';
import AdjRandomizePage from './pages/AdjRandomizePage';
import CountersPage from './pages/CountersPage';
import DaysPage from './pages/DaysPage';
import NumbersPage from './pages/NumbersPage';
import TimePage from './pages/TimePage';
import CountingThingsPage from './pages/CountingThingsPage';
import TransitivePage from './pages/TransitivePage';
import FamilyNamesPage from './pages/FamilyNamesPage';
import DisclaimerPage from './pages/DisclaimerPage';
import AdjectivesNounsPage from './pages/AdjectivesNounsPage';
import SentenceTxtLessonPage from './pages/SentenceTxtLessonPage';
import ContactPage from './pages/ContactPage';

export function ExerciseRouteTree() {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="genki" element={<Navigate to=".." replace />} />
      <Route path="genki/:lessonId" element={<GenkiLessonPage />} />
      <Route path="sentence/:lessonId" element={<SentenceTxtLessonPage />} />

      <Route path="teform" element={<VerbExercisePage />} />
      <Route path="causativeform" element={<VerbExercisePage />} />
      <Route path="conditionalform" element={<VerbExercisePage />} />
      <Route path="imperativeform" element={<VerbExercisePage />} />
      <Route path="negativeform" element={<VerbExercisePage />} />
      <Route path="passiveform" element={<VerbExercisePage />} />
      <Route path="pastform" element={<VerbExercisePage />} />
      <Route path="politeform" element={<VerbExercisePage />} />
      <Route path="politeform-short" element={<VerbExercisePage forceReverseQA />} />
      <Route path="potentialform" element={<VerbExercisePage />} />
      <Route path="provisionalform" element={<VerbExercisePage />} />
      <Route path="volitionalform" element={<VerbExercisePage />} />
      <Route path="randomize" element={<RandomizePage />} />

      <Route path="adj-naruform" element={<AdjExercisePage />} />
      <Route path="adj-conditionalform" element={<AdjExercisePage />} />
      <Route path="adj-negativeform" element={<AdjExercisePage />} />
      <Route path="adj-pastform" element={<AdjExercisePage />} />
      <Route path="adj-volitionalform" element={<AdjExercisePage />} />
      <Route path="adj-randomize" element={<AdjRandomizePage />} />

      <Route path="counters" element={<CountersPage />} />
      <Route path="counters-people" element={<CountersPage peopleOnly />} />
      <Route path="counting-things" element={<CountingThingsPage />} />
      <Route path="days" element={<DaysPage />} />
      <Route path="numbers" element={<NumbersPage />} />
      <Route path="time" element={<TimePage />} />

      <Route path="transitive" element={<TransitivePage />} />
      <Route path="family-names" element={<FamilyNamesPage />} />
      <Route path="adjectives-nouns" element={<AdjectivesNounsPage />} />
      <Route path="disclaimer" element={<DisclaimerPage />} />
      <Route path="contact" element={<ContactPage />} />
    </>
  );
}
