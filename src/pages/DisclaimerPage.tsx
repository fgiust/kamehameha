import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX } from '../types';

const PAGE_TITLE = 'Disclaimer';

export default function DisclaimerPage() {
  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{PAGE_TITLE}</h1>
        <div className="page-actions">
          <Link to="/" className="header-btn" aria-label="Back">{'<'}</Link>
        </div>
      </div>

      <div className="card">
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p>
            This app was inspired by the excellent work of Steven Kraft (<a href="https://steven-kraft.com/projects/japanese/" target="_blank" rel="noreferrer">https://steven-kraft.com/projects/japanese/</a>), with the goal of providing a more up-to-date and interactive set of exercises for learners.
          </p>
          <p style={{ marginTop: 12 }}>
            All exercises included in this app are original and do not reproduce any copyrighted material. While the exercises are organized following the structure of the Genki textbooks for convenience, they are independently created and are not derived from or copied from the Genki books or workbooks.
          </p>
          <p style={{ marginTop: 12 }}>
            Please note that, as this is an independent project created by a fellow learner, the content may contain occasional mistakes or inaccuracies. Feedback is highly appreciated: users are encouraged to report any errors or suggest improvements using the feedback tools available within the exercise pages.
          </p>
        </div>
      </div>
    </div>
  );
}
