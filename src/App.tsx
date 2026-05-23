import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
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
import FeedbackPanel from './components/FeedbackPanel';
import { Analytics } from '@vercel/analytics/react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from './i18n/index';

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

const CURRENT_INTERNAL_PATH_KEY = 'nihongo.currentInternalPath';
const PREV_INTERNAL_PATH_KEY = 'nihongo.prevInternalPath';
const SCROLL_POSITIONS_KEY = 'nihongo.scrollPositions';

function getScrollMap() {
  try {
    const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
    if (!raw) return {} as Record<string, number>;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {} as Record<string, number>;
    return parsed as Record<string, number>;
  } catch {
    return {} as Record<string, number>;
  }
}

function setScrollMap(next: Record<string, number>) {
  try {
    sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function AppShell() {
  const location = useLocation();
  const navType = useNavigationType();
  const showFeedback = !['/', '/disclaimer', '/contact', '/diff-test'].includes(location.pathname);
  const currentPathKey = useMemo(() => location.pathname + location.search, [location.pathname, location.search]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      history.scrollRestoration = 'manual';
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const prev = sessionStorage.getItem(CURRENT_INTERNAL_PATH_KEY);
      if (prev && prev !== currentPathKey) {
        sessionStorage.setItem(PREV_INTERNAL_PATH_KEY, prev);
      }
      sessionStorage.setItem(CURRENT_INTERNAL_PATH_KEY, currentPathKey);
    } catch {
      // ignore
    }
  }, [currentPathKey]);

  useLayoutEffect(() => {
    const state = location.state as unknown as { restoreScroll?: boolean } | null;
    const shouldRestore = navType === 'POP' || !!state?.restoreScroll;

    if (shouldRestore) {
      const map = getScrollMap();
      const y = map[currentPathKey];
      if (typeof y === 'number') {
        window.scrollTo(0, y);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentPathKey, location.state, navType]);

  useLayoutEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const map = getScrollMap();
        map[currentPathKey] = window.scrollY;
        setScrollMap(map);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [currentPathKey]);

  return (
    <>
      <DarkModeToggle />
      <LanguageToggle />
      {showFeedback && <FeedbackPanel />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genki" element={<Navigate to="/" replace />} />
        <Route path="/genki/:lessonId" element={<GenkiLessonPage />} />
        <Route path="/sentence/:lessonId" element={<SentenceTxtLessonPage />} />

        {/* Verb conjugation routes */}
        <Route path="/teform" element={<VerbExercisePage />} />
        <Route path="/causativeform" element={<VerbExercisePage />} />
        <Route path="/conditionalform" element={<VerbExercisePage />} />
        <Route path="/imperativeform" element={<VerbExercisePage />} />
        <Route path="/negativeform" element={<VerbExercisePage />} />
        <Route path="/passiveform" element={<VerbExercisePage />} />
        <Route path="/pastform" element={<VerbExercisePage />} />
        <Route path="/politeform" element={<VerbExercisePage />} />
        <Route path="/politeform-short" element={<VerbExercisePage forceReverseQA={true} />} />
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
        <Route path="/transitive" element={<TransitivePage />} />
        <Route path="/family-names" element={<FamilyNamesPage />} />
        <Route path="/adjectives-nouns" element={<AdjectivesNounsPage />} />
     <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={
          <div className="app-container" style={{ textAlign: 'center', marginTop: 100 }}>
            <h1>404 - Not Found</h1>
            <p>Page not found</p>
            <a href="/" style={{ color: 'var(--accent)' }}>Go to Homepage</a>
          </div>
        } />
      </Routes><Analytics />
    </>
  );
}
