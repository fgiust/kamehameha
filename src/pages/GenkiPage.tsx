import { Link } from 'react-router-dom';
import { homeConfig } from '../data/homeSections';

type GenkiChapterSection = {
  lesson: number;
  title: string;
  items: Array<{ id: string; title?: string }>;
};

function ChapterSection({ chapters }: { chapters: GenkiChapterSection[] }) {
  return (
    <div className="genki-section">
      {chapters.map(ch => (
        <div key={ch.lesson} style={{ marginBottom: 20 }}>
          <h3>{ch.title.replace(' - ', ' — ')}</h3>
          {ch.items.length > 0 ? (
            <ul className="genki-lesson-list">
              {ch.items.map(item => {
                const def = homeConfig.exercises[item.id];
                const path = def?.to;
                const title = item.title ?? def?.title ?? item.id;
                return (
                  <li key={item.id}>
                    {path ? (
                      <Link to={path}>
                        {title}
                      </Link>
                    ) : (
                      <span style={{ opacity: 0.5, padding: '10px 16px', display: 'block' }}>
                        {title}
                        <span className="badge" style={{ marginLeft: 8 }}>Soon</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '8px 0' }}>
              Content coming soon...
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GenkiPage() {
  const chapters: GenkiChapterSection[] = homeConfig.sections
    .filter(s => /^genki-\d+$/.test(s.id))
    .map(s => {
      const lesson = Number(s.id.slice('genki-'.length));
      return { lesson, title: s.title, items: s.items };
    })
    .sort((a, b) => a.lesson - b.lesson);

  return (
    <div className="app-container">
      <Link to="/" className="back-btn">Home</Link>
      <h1 className="page-heading">Genki Textbook Practice</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
        Exercises organized by Genki lesson topics. This app does not reproduce Genki textbook content that is protected by copyright.
      </p>

      <ChapterSection chapters={chapters} />
    </div>
  );
}
