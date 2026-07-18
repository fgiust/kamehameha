import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

const GenkiLessonPage = lazy(() => import('./pages/GenkiLessonPage'));
const VerbExercisePage = lazy(() => import('./pages/VerbExercisePage'));
const AdjExercisePage = lazy(() => import('./pages/AdjExercisePage'));
const RandomizePage = lazy(() => import('./pages/RandomizePage'));
const AdjRandomizePage = lazy(() => import('./pages/AdjRandomizePage'));
const CountersPage = lazy(() => import('./pages/CountersPage'));
const DaysPage = lazy(() => import('./pages/DaysPage'));
const NumbersPage = lazy(() => import('./pages/NumbersPage'));
const TimePage = lazy(() => import('./pages/TimePage'));
const CountingThingsPage = lazy(() => import('./pages/CountingThingsPage'));
const TransitivePage = lazy(() => import('./pages/TransitivePage'));
const TransitiveDropGamePage = lazy(() => import('./pages/TransitiveDropGamePage'));
const FamilyNamesPage = lazy(() => import('./pages/FamilyNamesPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const AdjectivesNounsPage = lazy(() => import('./pages/AdjectivesNounsPage'));
const SentenceTxtLessonPage = lazy(() => import('./pages/SentenceTxtLessonPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

/** Child <Route> elements for a localized route prefix (/ or /it). */
export function exerciseChildRoutes() {
  return [
    <Route key="index" index element={<HomePage />} />,
    <Route key="genki" path="genki" element={<Navigate to=".." replace />} />,
    <Route key="genki-lesson" path="genki/:lessonId" element={<GenkiLessonPage />} />,
    <Route key="sentence-lesson" path="sentence/:lessonId" element={<SentenceTxtLessonPage />} />,
    <Route key="auth-callback" path="auth/callback" element={<AuthCallbackPage />} />,

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
    <Route key="transitive-drop" path="transitive-drop" element={<TransitiveDropGamePage />} />,
    <Route key="family-names" path="family-names" element={<FamilyNamesPage />} />,
    <Route key="adjectives-nouns" path="adjectives-nouns" element={<AdjectivesNounsPage />} />,
    <Route key="disclaimer" path="disclaimer" element={<DisclaimerPage />} />,
    <Route key="privacy-policy" path="privacy-policy" element={<PrivacyPolicyPage />} />,
    <Route key="terms-of-service" path="terms-of-service" element={<TermsOfServicePage />} />,
    <Route key="contact" path="contact" element={<ContactPage />} />,
  ];
}
