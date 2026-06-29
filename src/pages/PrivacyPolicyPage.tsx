import { useTranslation } from 'react-i18next';
import LegalDocumentPage from '../components/LegalDocumentPage';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <LegalDocumentPage
      pageTitle={t('common.privacyPolicy')}
      effectiveDateLabel={t('legal.effectiveDate')}
      effectiveDate={t('privacyPolicy.effectiveDateValue')}
    >
      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.introTitle')}</h2>
        <p>{t('privacyPolicy.introP1')}</p>
        <p>{t('privacyPolicy.introP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.dataTitle')}</h2>
        <p>{t('privacyPolicy.dataP1')}</p>
        <p>{t('privacyPolicy.dataP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.useTitle')}</h2>
        <p>{t('privacyPolicy.useP1')}</p>
        <p>{t('privacyPolicy.useP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.sharingTitle')}</h2>
        <p>{t('privacyPolicy.sharingP1')}</p>
        <p>{t('privacyPolicy.sharingP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.retentionTitle')}</h2>
        <p>{t('privacyPolicy.retentionP1')}</p>
        <p>{t('privacyPolicy.retentionP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.childrenTitle')}</h2>
        <p>{t('privacyPolicy.childrenP1')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('privacyPolicy.changesTitle')}</h2>
        <p>{t('privacyPolicy.changesP1')}</p>
      </section>
    </LegalDocumentPage>
  );
}
