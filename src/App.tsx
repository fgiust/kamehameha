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
import CountingThingsPage from './pages/CountingThingsPage';
import DiffTestPage from './pages/DiffTestPage';
import NaVsNoPage from './pages/NaVsNoPage';
import TransitivePage from './pages/TransitivePage';
import FamilyNamesPage from './pages/FamilyNamesPage';
import DisclaimerPage from './pages/DisclaimerPage';
import AdjectivesNounsPage from './pages/AdjectivesNounsPage';
import ContactPage from './pages/ContactPage';
import FeedbackPanel from './components/FeedbackPanel';
import { Analytics } from '@vercel/analytics/react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from './i18n';

function DarkModeToggle() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') !== 'light'; } catch { return true; }
  });

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [dark]);

  return (
    <button className="darkmode-toggle" onClick={() => setDark(d => !d)} title={t('common.toggleDarkMode')}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';

  const langs: { code: 'en' | 'it'; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' }
  ];

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  return (
    <div className="lang-toggle-container" onClick={e => e.stopPropagation()}>
      <button
        className="lang-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={t('common.language')}
        aria-label={t('common.language')}
      >
        {lang.toUpperCase()}
      </button>
      {isOpen && (
        <div className="lang-menu">
          {langs.map(l => (
            <button
              key={l.code}
              className={`lang-menu-item ${lang === l.code ? 'active' : ''}`}
              onClick={() => {
                void setAppLanguage(l.code);
                setIsOpen(false);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
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
  const showFeedback = !['/', '/disclaimer', '/contact', '/diff-test'].includes(location.pathname);

  return (
    <>
      <DarkModeToggle />
      <LanguageToggle />
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
        <Route path="/counting-things" element={<CountingThingsPage />} />
        <Route path="/days" element={<DaysPage />} />
        <Route path="/numbers" element={<NumbersPage />} />
        <Route path="/time" element={<TimePage />} />

        {/* Other */}
        <Route path="/na-vs-no" element={<NaVsNoPage />} />
        <Route path="/transitive" element={<TransitivePage />} />
        <Route path="/family-names" element={<FamilyNamesPage />} />
        <Route path="/adjectives-nouns" element={<AdjectivesNounsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/diff-test" element={<DiffTestPage />} />
      </Routes>
      <Analytics />
    </>
  );
}
