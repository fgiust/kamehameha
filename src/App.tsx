import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import DiffTestPage from './pages/DiffTestPage';
import NaVsNoPage from './pages/NaVsNoPage';
import TransitivePage from './pages/TransitivePage';
import FamilyNamesPage from './pages/FamilyNamesPage';
import DisclaimerPage from './pages/DisclaimerPage';
import AdjectivesNounsPage from './pages/AdjectivesNounsPage';
import FeedbackPanel from './components/FeedbackPanel';
import { Analytics } from "@vercel/analytics/next"

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [dark]);

  return (
    <button className="darkmode-toggle" onClick={() => setDark(d => !d)} title="Toggle dark mode">
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const showFeedback = !['/', '/disclaimer', '/diff-test'].includes(location.pathname);

  return (
    <>
      <DarkModeToggle />
      {showFeedback && <FeedbackPanel />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genki" element={<Navigate to="/" replace />} />
        <Route path="/genki/:lessonId" element={<GenkiLessonPage />} />

        {/* Verb conjugation routes */}
        <Route path="/teform" element={<VerbExercisePage />} />
        <Route path="/causativeform" element={<VerbExercisePage />} />
        <Route path="/conditionalform" element={<VerbExercisePage />} />
        <Route path="/imperativeform" element={<VerbExercisePage />} />
        <Route path="/negativeform" element={<VerbExercisePage />} />
        <Route path="/passiveform" element={<VerbExercisePage />} />
        <Route path="/pastform" element={<VerbExercisePage />} />
        <Route path="/politeform" element={<VerbExercisePage />} />
        <Route path="/potentialform" element={<VerbExercisePage />} />
        <Route path="/provisionalform" element={<VerbExercisePage />} />
        <Route path="/volitionalform" element={<VerbExercisePage />} />
        <Route path="/randomize" element={<RandomizePage />} />

        {/* Adjective conjugation routes */}
        <Route path="/adj-naruform" element={<AdjExercisePage />} />
        <Route path="/adj-conditionalform" element={<AdjExercisePage />} />
        <Route path="/adj-negativeform" element={<AdjExercisePage />} />
        <Route path="/adj-pastform" element={<AdjExercisePage />} />
        <Route path="/adj-volitionalform" element={<AdjExercisePage />} />
        <Route path="/adj-randomize" element={<AdjRandomizePage />} />

        {/* Numbers & Counters */}
        <Route path="/counters" element={<CountersPage />} />
        <Route path="/counters-people" element={<CountersPage peopleOnly={true} />} />
        <Route path="/days" element={<DaysPage />} />
        <Route path="/numbers" element={<NumbersPage />} />
        <Route path="/time" element={<TimePage />} />

        {/* Other */}
        <Route path="/na-vs-no" element={<NaVsNoPage />} />
        <Route path="/transitive" element={<TransitivePage />} />
        <Route path="/family-names" element={<FamilyNamesPage />} />
        <Route path="/adjectives-nouns" element={<AdjectivesNounsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />

        <Route path="/diff-test" element={<DiffTestPage />} />
      </Routes>
      <Analytics />
    </>
  );
}
