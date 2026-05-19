import { Link } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { genkiIChapters, genkiIIChapters, GenkiChapter, getGenkiLessonById } from '../data/genkiLessons';
import { APP_TITLE_PREFIX, DEFAULT_MASTERY_RANDOM_TOTAL } from '../types';
import adjectives from '../data/adjectives';
import { adjectivesNounsSentenceData } from '../data/adjectivesNouns';
import counters from '../data/counters';
import { familyNamesData } from '../data/familyNamesData';
import { naVsNoData } from '../data/naVsNoData';
import { transitiveData } from '../data/transitiveData';
import verbs from '../data/verbs';
import { ProgressSegmentState, readPersistedSessionProgress, SESSION_PROGRESS_UPDATED_EVENT } from '../hooks/useSessionProgress';

const VERB_TOTAL = verbs.length;
const ADJ_TOTAL = adjectives.length;
const COUNTERS_DEFAULT_TOTAL = counters.reduce((acc, c) => acc + c.readings.length + Object.keys(c.extraReadings ?? {}).length, 0);
const COUNTERS_PEOPLE_TOTAL = (() => {
  const c = counters.find(x => x.meaning[1] === 'people');
  if (!c) return 0;
  return c.readings.length + Object.keys(c.extraReadings ?? {}).length;
})();
const TRANSITIVE_TOTAL = transitiveData.length;
const NA_VS_NO_TOTAL = naVsNoData.questions['な'].length + naVsNoData.questions['の'].length;
const FAMILY_NAMES_TOTAL = familyNamesData.length;
const ADJECTIVES_NOUNS_TOTAL = adjectivesNounsSentenceData.length;
const COUNTING_THINGS_TOTAL = 30;

function buildMiniSegments(persistKey: string, totalSegments: number) {
  const total = Math.max(1, totalSegments);
  const persisted = readPersistedSessionProgress(persistKey);
  const out = Array(total).fill(0) as ProgressSegmentState[];
  if (!persisted) return out;
  for (let i = 0; i < Math.min(total, persisted.length); i++) {
    out[i] = persisted[i] ?? 0;
  }
  return out;
}

function getDefaultTotalSegmentsForPath(path: string) {
  if (path.startsWith('/genki/')) {
    const id = path.slice('/genki/'.length);
    const lesson = getGenkiLessonById(id);
    if (lesson) return lesson.sentenceData.length;
  }

  if (path === '/randomize') return VERB_TOTAL;
  if (/^\/(teform|causativeform|conditionalform|imperativeform|negativeform|passiveform|pastform|politeform|potentialform|provisionalform|volitionalform)$/.test(path)) {
    return VERB_TOTAL;
  }

  if (path === '/adj-randomize') return ADJ_TOTAL;
  if (/^\/adj-(naruform|conditionalform|negativeform|pastform|volitionalform)$/.test(path)) {
    return ADJ_TOTAL;
  }

  if (path === '/counters') return COUNTERS_DEFAULT_TOTAL;
  if (path === '/counters-people') return COUNTERS_PEOPLE_TOTAL;
  if (path === '/counting-things') return COUNTING_THINGS_TOTAL;
  if (path === '/days') return 31;
  if (path === '/numbers') return DEFAULT_MASTERY_RANDOM_TOTAL;
  if (path === '/time') return DEFAULT_MASTERY_RANDOM_TOTAL;
  if (path === '/transitive') return TRANSITIVE_TOTAL;
  if (path === '/na-vs-no') return NA_VS_NO_TOTAL;
  if (path === '/family-names') return FAMILY_NAMES_TOTAL;
  if (path === '/adjectives-nouns') return ADJECTIVES_NOUNS_TOTAL;

  return 12;
}

function MiniProgressBar({ persistKey, defaultTotal }: { persistKey: string; defaultTotal: number }) {
  const [segments, setSegments] = useState<ProgressSegmentState[]>(() => buildMiniSegments(persistKey, defaultTotal));

  useEffect(() => {
    setSegments(buildMiniSegments(persistKey, defaultTotal));

    const refresh = () => setSegments(buildMiniSegments(persistKey, defaultTotal));
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ persistKey?: string }>).detail;
      if (!detail?.persistKey || detail.persistKey === persistKey) refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(SESSION_PROGRESS_UPDATED_EVENT, onUpdated as EventListener);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(SESSION_PROGRESS_UPDATED_EVENT, onUpdated as EventListener);
    };
  }, [defaultTotal, persistKey]);

  return (
    <div className="home-mini-progress" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
      {segments.map((s, i) => (
        <span
          key={i}
          className={`home-mini-progress-cell ${s === 1 ? 'is-correct' : s === 2 ? 'is-incorrect' : ''}`}
        />
      ))}
    </div>
  );
}

function HomeLinkCard({ to, children, defaultTotal }: { to: string; children: ReactNode; defaultTotal?: number }) {
  const total = defaultTotal ?? getDefaultTotalSegmentsForPath(to);
  return (
    <div className="link-card-stack">
      <Link to={to} className="link-card">{children}</Link>
      <MiniProgressBar persistKey={to} defaultTotal={total} />
    </div>
  );
}

function GenkiBlock({ bookLabel, chapters }: { bookLabel: 'Genki I' | 'Genki II'; chapters: GenkiChapter[] }) {
  return (
    <>
      {chapters.map(ch => (
        <div key={`${bookLabel}-${ch.lesson}`}>
          <h3 className="section-title" style={{ marginTop: 18 }}>{bookLabel} - Lesson {ch.lesson}</h3>
          <div className="link-grid">
            {ch.links.map(link => (
              link.path ? (
                <HomeLinkCard key={link.id} to={link.path}>{link.title}</HomeLinkCard>
              ) : (
                <span key={link.id} className="link-card" style={{ opacity: 0.5 }}>
                  {link.title} <span className="badge">Soon</span>
                </span>
              )
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

const PAGE_TITLE = 'kamehameha!';

export default function HomePage() {
  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  return (
    <div className="app-container">
      <h1 className="page-heading home-brand">
        <span className="home-brand-logo" aria-hidden="true">亀</span>
        <span className="home-brand-name">{PAGE_TITLE}</span>
      </h1>
      <p className="home-tagline is-lead">
        Charge your かめはめ波 and destroy your Japanese barriers!
      </p>
      <p className="home-tagline is-body">
        Powerful interactive training for grammar, vocabulary, and kanji. Charge, fire, level up. No mercy.
      </p>

      <h2 className="section-title">Verb Conjugation Practice</h2>
      <div className="link-grid">
        <HomeLinkCard to="/teform">て-Form</HomeLinkCard>
        <HomeLinkCard to="/causativeform">Causative Form</HomeLinkCard>
        <HomeLinkCard to="/conditionalform">Conditional Form</HomeLinkCard>
        <HomeLinkCard to="/imperativeform">Imperative Form</HomeLinkCard>
        <HomeLinkCard to="/negativeform">Negative Form</HomeLinkCard>
        <HomeLinkCard to="/passiveform">Passive Form</HomeLinkCard>
        <HomeLinkCard to="/pastform">Past Form</HomeLinkCard>
        <HomeLinkCard to="/politeform">Polite Form</HomeLinkCard>
        <HomeLinkCard to="/potentialform">Potential Form</HomeLinkCard>
        <HomeLinkCard to="/provisionalform">Provisional Form</HomeLinkCard>
        <HomeLinkCard to="/volitionalform">Volitional Form</HomeLinkCard>
        <HomeLinkCard to="/randomize">Randomized Forms</HomeLinkCard>
      </div>

      <h2 className="section-title">Adjective Conjugation Practice</h2>
      <div className="link-grid">
        <HomeLinkCard to="/adj-naruform">なる Form</HomeLinkCard>
        <HomeLinkCard to="/adj-conditionalform">Conditional Form</HomeLinkCard>
        <HomeLinkCard to="/adj-negativeform">Negative Form</HomeLinkCard>
        <HomeLinkCard to="/adj-pastform">Past Form</HomeLinkCard>
        <HomeLinkCard to="/adj-volitionalform">Volitional Form</HomeLinkCard>
        <HomeLinkCard to="/adj-randomize">Randomized Forms</HomeLinkCard>
      </div>

      <h2 className="section-title">Other</h2>
      <div className="link-grid">
        <HomeLinkCard to="/counters">Counters</HomeLinkCard>
        <HomeLinkCard to="/counting-things">Counting things</HomeLinkCard>
        <HomeLinkCard to="/days">Days of the Month</HomeLinkCard>
        <HomeLinkCard to="/numbers">Numbers</HomeLinkCard>
        <HomeLinkCard to="/time">Time</HomeLinkCard>
        <HomeLinkCard to="/transitive">Transitive / Intransitive pairs</HomeLinkCard>
        <HomeLinkCard to="/na-vs-no">な vs の Adjectives</HomeLinkCard>
        <HomeLinkCard to="/family-names">Common family names</HomeLinkCard>
        <HomeLinkCard to="/adjectives-nouns">Adjectives + nouns</HomeLinkCard>
      </div>

      <h2 className="genki-supp-title">Genki supplementary exercises</h2>
      <p className="genki-supp-desc">
        Grammar exercises organized by Genki lesson topics.
        This app does not reproduce any copyrighted content from the Genki textbooks.
        The exercises are original and are simply organized following the same lesson order to provide well-structured supplementary practice for Genki learners.
      </p>
      <GenkiBlock bookLabel="Genki I" chapters={genkiIChapters} />
      <GenkiBlock bookLabel="Genki II" chapters={genkiIIChapters} />

      <footer className="home-footer">
        <span className="home-footer-text">kamehameha v{__APP_VERSION__}</span>
        <span className="home-footer-sep">·</span>
        <Link to="/disclaimer" className="home-footer-link">Disclaimer</Link>
        <span className="home-footer-sep">·</span>
        <Link to="/contact" className="home-footer-link">Contact</Link>
        <span className="home-footer-sep">·</span>
        <Link to="/diff-test" className="home-footer-link">TenshinDiff test page</Link>
      </footer>
    </div>
  );
}
