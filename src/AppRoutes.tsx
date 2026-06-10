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

/** Child <Route> elements for a localized route prefix (/ or /it). */
export function exerciseChildRoutes() {
  return [
    <Route key="index" index element={<HomePage />} />,
    <Route key="genki" path="genki" element={<Navigate to=".." replace />} />,
    <Route key="genki-lesson" path="genki/:lessonId" element={<GenkiLessonPage />} />,
    <Route key="sentence-lesson" path="sentence/:lessonId" element={<SentenceTxtLessonPage />} />,

    <Route key="teform" path="teform" element={<VerbExercisePage />} />,
    <Route key="causativeform" path="causativeform" element={<VerbExercisePage />} />,
    <Route key="conditionalform" path="conditionalform" element={<VerbExercisePage />} />,
    <Route key="imperativeform" path="imperativeform" element={<VerbExercisePage />} />,
    <Route key="negativeform" path="negativeform" element={<VerbExercisePage />} />,
    <Route key="passiveform" path="passiveform" element={<VerbExercisePage />} />,
    <Route key="pastform" path="pastform" element={<VerbExercisePage />} />,
    <Route key="politeform" path="politeform" element={<VerbExercisePage />} />,
    <Route key="politeform-short" path="politeform-short" element={<VerbExercisePage forceReverseQA />} />,
    <Route key="potentialform" path="potentialform" element={<VerbExercisePage />} />,
    <Route key="provisionalform" path="provisionalform" element={<VerbExercisePage />} />,
    <Route key="volitionalform" path="volitionalform" element={<VerbExercisePage />} />,
    <Route key="randomize" path="randomize" element={<RandomizePage />} />,

    <Route key="adj-naruform" path="adj-naruform" element={<AdjExercisePage />} />,
    <Route key="adj-conditionalform" path="adj-conditionalform" element={<AdjExercisePage />} />,
    <Route key="adj-negativeform" path="adj-negativeform" element={<AdjExercisePage />} />,
    <Route key="adj-pastform" path="adj-pastform" element={<AdjExercisePage />} />,
    <Route key="adj-volitionalform" path="adj-volitionalform" element={<AdjExercisePage />} />,
    <Route key="adj-randomize" path="adj-randomize" element={<AdjRandomizePage />} />,

    <Route key="counters" path="counters" element={<CountersPage />} />,
    <Route key="counters-people" path="counters-people" element={<CountersPage peopleOnly />} />,
    <Route key="counting-things" path="counting-things" element={<CountingThingsPage />} />,
    <Route key="days" path="days" element={<DaysPage />} />,
    <Route key="numbers" path="numbers" element={<NumbersPage />} />,
    <Route key="time" path="time" element={<TimePage />} />,

    <Route key="transitive" path="transitive" element={<TransitivePage />} />,
    <Route key="family-names" path="family-names" element={<FamilyNamesPage />} />,
    <Route key="adjectives-nouns" path="adjectives-nouns" element={<AdjectivesNounsPage />} />,
    <Route key="disclaimer" path="disclaimer" element={<DisclaimerPage />} />,
    <Route key="contact" path="contact" element={<ContactPage />} />,
  ];
}
