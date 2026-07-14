import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Suspense, lazy, useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { exerciseChildRoutes } from './AppRoutes';
import BackButton from './components/BackButton';
import FeedbackPanel from './components/FeedbackPanel';
import DebugModeIndicator from './components/DebugModeIndicator';
import SettingsPanel from './components/SettingsPanel';
import AnalyticsPageviews from './components/AnalyticsPageviews';
import PageMetaManager from './seo/PageMetaManager';
import { stripLangPrefix } from './seo/localizedPaths';
import { scheduleNotoSansJpLoad } from './utils/loadNotoSansJp';
import { ensureGtagBootstrap } from './utils/loadGoogleAnalytics';
import { bootstrapGaTrackingChannel } from './utils/gaTrackingChannel';
import { syncDebugModeFromSearch } from './utils/debugMode';
import { clearAllExerciseSessionDrafts } from './utils/exerciseSessionDraft';

const Analytics = lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })));
const SpeedInsights = lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })));

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
  const showFeedback = !['/', '/disclaimer', '/privacy-policy', '/terms-of-service', '/contact', '/diff-test'].includes(internalPath);
  const currentPathKey = useMemo(() => location.pathname + location.search, [location.pathname, location.search]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    scheduleNotoSansJpLoad();
    ensureGtagBootstrap();
    void bootstrapGaTrackingChannel();
  }, []);

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
      <AnalyticsPageviews />
      {showBack && (
        <div className="back-nav-container">
          <BackButton />
        </div>
      )}
      <SettingsPanel />
      <DebugModeIndicator />
      {showFeedback && <FeedbackPanel />}
      <Suspense fallback={null}>
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
        </Routes>
      </Suspense>
      <Suspense fallback={null}>
        <Analytics />
        <SpeedInsights />
      </Suspense>
    </>
  );
}
