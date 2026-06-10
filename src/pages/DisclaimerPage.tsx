import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
export default function DisclaimerPage() {
  const { t } = useTranslation();

  return (
    <PageLayout pageTitle={t('common.disclaimer')}>
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
    </PageLayout>
  );
}
