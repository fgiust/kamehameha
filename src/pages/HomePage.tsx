import { Link } from 'react-router-dom';
import React, { ReactNode, useEffect, useState } from 'react';
import { homeConfig } from '../data/homeSections';
import { APP_TITLE_PREFIX } from '../types';
import { ProgressSegmentState, readPersistedSessionProgress, SESSION_PROGRESS_UPDATED_EVENT } from '../hooks/useSessionProgress';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { resolveText } from '../i18n/resolve';

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

function renderSection(section: (typeof homeConfig.sections)[number], t: TFunction) {
  const titleClassName = section.titleClassName ?? 'section-title';
  const descriptionClassName = section.descriptionClassName ?? 'genki-supp-desc';
  const titleLevel = section.titleLevel ?? 2;
  const sectionTitle = resolveText(t, section.title);

  return (
    <div key={section.id}>
      {titleLevel === 3 ? (
        <h3 className={titleClassName} style={{ marginTop: 18 }}>{sectionTitle}</h3>
      ) : (
        <h2 className={titleClassName}>{sectionTitle}</h2>
      )}
      {section.description && (
        <p className={descriptionClassName}>
          {resolveText(t, section.description).split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </p>
      )}

      {section.items.length > 0 && (
        <div className="link-grid">
          {section.items.map(item => {
            const def = homeConfig.exercises[item.id];
            const title = resolveText(t, item.title ?? def?.title ?? item.id);
            const to = def?.to;
            const defaultTotal = def?.defaultTotal ?? 12;
            return to ? (
              <HomeLinkCard key={item.id} to={to} defaultTotal={defaultTotal}>{title}</HomeLinkCard>
            ) : (
              <span key={item.id} className="link-card" style={{ opacity: 0.5 }}>
                {title} <span className="badge">{t('common.soon')}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PAGE_TITLE = 'kamehameha!';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, [i18n.language]);

  return (
    <div className="app-container">
      <h1 className="page-heading home-brand">
        <span className="home-brand-logo" aria-hidden="true">亀</span>
        <span className="home-brand-name">{PAGE_TITLE}</span>
      </h1>
      <p className="home-tagline is-lead">
        {t('home.taglineLead')}
      </p>
      <p className="home-tagline is-body">
        {t('home.taglineBody')}
      </p>
      {homeConfig.sections.map(s => renderSection(s, t))}

      <footer className="home-footer">
        <span className="home-footer-text">kamehameha v{__APP_VERSION__}</span>
        <span className="home-footer-sep">·</span>
        <Link to="/disclaimer" className="home-footer-link">{t('common.disclaimer')}</Link>
        <span className="home-footer-sep">·</span>
        <Link to="/contact" className="home-footer-link">{t('common.contact')}</Link>

        {/* <span className="home-footer-sep">·</span>
        <Link to="/diff-test" className="home-footer-link">TenshinDiff test page</Link> */}

      </footer>
    </div>
  );
}
