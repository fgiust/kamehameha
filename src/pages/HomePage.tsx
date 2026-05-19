import { Link } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { homeSections } from '../data/homeSections';
import { APP_TITLE_PREFIX } from '../types';
import { ProgressSegmentState, readPersistedSessionProgress, SESSION_PROGRESS_UPDATED_EVENT } from '../hooks/useSessionProgress';

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
  const total = Math.max(1, defaultTotal ?? 12);
  return (
    <div className="link-card-stack">
      <Link to={to} className="link-card">{children}</Link>
      <MiniProgressBar persistKey={to} defaultTotal={total} />
    </div>
  );
}

function getGenkiBookLabel(lesson: number) {
  return lesson <= 12 ? 'Genki I' : 'Genki II';
}

function renderSection(section: (typeof homeSections)[number]) {
  if (section.kind === 'grid') {
    return (
      <div key={section.id}>
        <h2 className="section-title">{section.title}</h2>
        <div className="link-grid">
          {section.items.map(item => (
            <HomeLinkCard key={item.id} to={item.to ?? '/'} defaultTotal={item.defaultTotal}>
              {item.title}
            </HomeLinkCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div key={section.id}>
      <h2 className="genki-supp-title">{section.title}</h2>
      <p className="genki-supp-desc">
        {section.description[0]}
        {' '}
        {section.description[1]}
        {' '}
        {section.description[2]}
      </p>
      {section.chapters.map(ch => (
        <div key={ch.lesson}>
          <h3 className="section-title" style={{ marginTop: 18 }}>{getGenkiBookLabel(ch.lesson)} - Lesson {ch.lesson}</h3>
          <div className="link-grid">
            {ch.items.map(item => (
              item.to ? (
                <HomeLinkCard key={item.id} to={item.to} defaultTotal={item.defaultTotal}>{item.title}</HomeLinkCard>
              ) : (
                <span key={item.id} className="link-card" style={{ opacity: 0.5 }}>
                  {item.title} <span className="badge">Soon</span>
                </span>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
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
      {homeSections.map(renderSection)}

      <footer className="home-footer">
        <span className="home-footer-text">kamehameha v{__APP_VERSION__}</span>
        <span className="home-footer-sep">·</span>
        <Link to="/disclaimer" className="home-footer-link">Disclaimer</Link>
        <span className="home-footer-sep">·</span>
        <Link to="/contact" className="home-footer-link">Contact</Link>

        {/* <span className="home-footer-sep">·</span>
        <Link to="/diff-test" className="home-footer-link">TenshinDiff test page</Link> */}

      </footer>
    </div>
  );
}
