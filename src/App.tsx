import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { exerciseChildRoutes } from './AppRoutes';
import BackButton from './components/BackButton';
import FeedbackPanel from './components/FeedbackPanel';
import DebugModeIndicator from './components/DebugModeIndicator';
import SettingsPanel from './components/SettingsPanel';
import UmamiPageviews from './components/UmamiPageviews';
import PageMetaManager from './seo/PageMetaManager';
import { stripLangPrefix } from './seo/localizedPaths';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { syncDebugModeFromSearch } from './utils/debugMode';
import { clearAllExerciseSessionDrafts } from './utils/exerciseSessionDraft';

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
  const internalPath = stripLangPrefix(location.pathname);
  const showBack = internalPath !== '/';
  const showFeedback = !['/', '/disclaimer', '/contact', '/diff-test'].includes(internalPath);
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
    syncDebugModeFromSearch(location.search);
  }, [location.search]);

  useEffect(() => {
    if (internalPath === '/') {
      clearAllExerciseSessionDrafts();
    }
  }, [internalPath]);

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
      <PageMetaManager />
      <UmamiPageviews />
      {showBack && (
        <div className="back-nav-container">
          <BackButton />
        </div>
      )}
      <SettingsPanel />
      <DebugModeIndicator />
      {showFeedback && <FeedbackPanel />}
      <Routes>
        <Route path="/it">{exerciseChildRoutes()}</Route>
        <Route path="/">{exerciseChildRoutes()}</Route>
        <Route path="*" element={
          <div className="app-container" style={{ textAlign: 'center', marginTop: 100 }}>
            <h1>404 - Not Found</h1>
            <p>Page not found</p>
            <a href="/" style={{ color: 'var(--accent)' }}>Go to Homepage</a>
          </div>
        } />
      </Routes><Analytics />
      <SpeedInsights />
    </>
  );
}
