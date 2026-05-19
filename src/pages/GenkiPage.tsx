import { Link } from 'react-router-dom';
import { genkiIChapters, genkiIIChapters } from '../data/genkiLessons';
import { GenkiChapter } from '../types';

function ChapterSection({ chapters, sectionTitle }: { chapters: GenkiChapter[]; sectionTitle: string }) {
  return (
    <div className="genki-section">
      <h4>{sectionTitle}</h4>
      {chapters.map(ch => (
        <div key={ch.lesson} style={{ marginBottom: 20 }}>
          <h3>Lesson {ch.lesson}</h3>
          {ch.links.length > 0 ? (
            <ul className="genki-lesson-list">
              {ch.links.map(link => (
                <li key={link.id}>
                  {link.path ? (
                    <Link to={link.path}>
                      {link.title}
                    </Link>
                  ) : (
                    <span style={{ opacity: 0.5, padding: '10px 16px', display: 'block' }}>
                      {link.title}
                      <span className="badge" style={{ marginLeft: 8 }}>Soon</span>
                    </span>
                  )}
                </li>
              ))}
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
  return (
    <div className="app-container">
      <Link to="/" className="back-btn">Home</Link>
      <h1 className="page-heading">Genki Textbook Practice</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
        Exercises organized by Genki lesson topics. This app does not reproduce Genki textbook content that is protected by copyright.
      </p>

      <ChapterSection chapters={genkiIChapters} sectionTitle="Genki I" />
      <ChapterSection chapters={genkiIIChapters} sectionTitle="Genki II" />
    </div>
  );
}
