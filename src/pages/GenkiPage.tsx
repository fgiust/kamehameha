import { Link } from 'react-router-dom';
import { genkiChapters, getGenkiLinkPath, getGenkiLinkTitle } from '../data/genkiLessons';
import { GenkiChapter } from '../types';

function getGenkiBookLabel(lesson: number) {
  return lesson <= 12 ? 'Genki I' : 'Genki II';
}

function ChapterSection({ chapters }: { chapters: GenkiChapter[] }) {
  return (
    <div className="genki-section">
      {chapters.map(ch => (
        <div key={ch.lesson} style={{ marginBottom: 20 }}>
          <h3>{getGenkiBookLabel(ch.lesson)} — Lesson {ch.lesson}</h3>
          {ch.links.length > 0 ? (
            <ul className="genki-lesson-list">
              {ch.links.map(link => {
                const path = getGenkiLinkPath(link);
                const title = getGenkiLinkTitle(link);
                return (
                  <li key={link.id}>
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
  return (
    <div className="app-container">
      <Link to="/" className="back-btn">Home</Link>
      <h1 className="page-heading">Genki Textbook Practice</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
        Exercises organized by Genki lesson topics. This app does not reproduce Genki textbook content that is protected by copyright.
      </p>

      <ChapterSection chapters={genkiChapters} />
    </div>
  );
}
