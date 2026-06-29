import { useTranslation } from 'react-i18next';
import LegalDocumentPage from '../components/LegalDocumentPage';

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <LegalDocumentPage
      pageTitle={t('common.termsOfService')}
      effectiveDateLabel={t('legal.effectiveDate')}
      effectiveDate={t('termsOfService.effectiveDateValue')}
    >
      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.acceptanceTitle')}</h2>
        <p>{t('termsOfService.acceptanceP1')}</p>
        <p>{t('termsOfService.acceptanceP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.useTitle')}</h2>
        <p>{t('termsOfService.useP1')}</p>
        <p>{t('termsOfService.useP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.accountTitle')}</h2>
        <p>{t('termsOfService.accountP1')}</p>
        <p>{t('termsOfService.accountP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.contentTitle')}</h2>
        <p>{t('termsOfService.contentP1')}</p>
        <p>{t('termsOfService.contentP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.availabilityTitle')}</h2>
        <p>{t('termsOfService.availabilityP1')}</p>
        <p>{t('termsOfService.availabilityP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.liabilityTitle')}</h2>
        <p>{t('termsOfService.liabilityP1')}</p>
        <p>{t('termsOfService.liabilityP2')}</p>
      </section>

      <section className="legal-page-section">
        <h2 className="legal-page-section-title">{t('termsOfService.changesTitle')}</h2>
        <p>{t('termsOfService.changesP1')}</p>
      </section>
    </LegalDocumentPage>
  );
}
