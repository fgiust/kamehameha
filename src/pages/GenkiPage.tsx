import { Link } from 'react-router-dom';
import { homeConfig } from '../data/homeSections';
import { useTranslation } from 'react-i18next';
import { resolveText } from '../i18n/resolve';
import type { LocalizedText } from '../types';
import { getGenkiLessonById } from '../lessons/genkiLessons';

type GenkiChapterSection = {
  lesson: number;
  title: LocalizedText;
  items: Array<{ id: string; title?: LocalizedText }>;
};

function ChapterSection({ chapters }: { chapters: GenkiChapterSection[] }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  return (
    <div className="genki-section">
      {chapters.map(ch => (
        <div key={ch.lesson} style={{ marginBottom: 20 }}>
          <h3>{resolveText(t, ch.title).replace(' - ', ' — ')}</h3>
          {ch.items.length > 0 ? (
            <ul className="genki-lesson-list">
              {ch.items.map(item => {
                const def = homeConfig.exercises[item.id];
                const path = def?.to;
                const rawTitle = resolveText(t, item.title ?? def?.title ?? item.id);
                const lesson = getGenkiLessonById(item.id);
                const title = lesson
                  ? (lang === 'it' ? (lesson.titleItalian ?? lesson.title) : lesson.title)
                  : rawTitle;
                return (
                  <li key={item.id}>
                    {path ? (
                      <Link to={path}>
                        {title}
                      </Link>
                    ) : (
                      <span style={{ opacity: 0.5, padding: '10px 16px', display: 'block' }}>
                        {title}
                        <span className="badge" style={{ marginLeft: 8 }}>{t('common.soon')}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '8px 0' }}>
              {t('common.contentComingSoon')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GenkiPage() {
  const { t } = useTranslation();
  const chapters: GenkiChapterSection[] = homeConfig.sections
    .filter(s => /^genki-\d+$/.test(s.id))
    .map(s => {
      const lesson = Number(s.id.slice('genki-'.length));
      return { lesson, title: s.title, items: s.items };
    })
    .sort((a, b) => a.lesson - b.lesson);

  return (
    <div className="app-container">
      <Link to="/" className="back-btn">{t('common.home')}</Link>
      <h1 className="page-heading">{t('genkiPage.title')}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
        {t('genkiPage.description')}
      </p>

      <ChapterSection chapters={chapters} />
    </div>
  );
}
