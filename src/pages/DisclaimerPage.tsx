import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX } from '../types';
import { useTranslation } from 'react-i18next';

export default function DisclaimerPage() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.title = APP_TITLE_PREFIX + t('common.disclaimer');
  }, [i18n.language]);

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{t('common.disclaimer')}</h1>
        <div className="page-actions">
          <Link to="/" className="header-btn" aria-label={t('common.back')}>{'<'}</Link>
        </div>
      </div>

      <div className="card">
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p>
            {t('disclaimer.p1')}{' '}
            <a href="https://steven-kraft.com/projects/japanese/" target="_blank" rel="noreferrer">
              https://steven-kraft.com/projects/japanese/
            </a>
            {t('disclaimer.p1b')}
          </p>
          <p style={{ marginTop: 12 }}>
            {t('disclaimer.p2')}
          </p>
          <p style={{ marginTop: 12 }}>
            {t('disclaimer.p3')}
          </p>
        </div>
      </div>
    </div>
  );
}
