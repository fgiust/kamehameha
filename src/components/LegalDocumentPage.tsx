import type { ReactNode } from 'react';
import PageLayout from './PageLayout';

type Props = {
  pageTitle: string;
  effectiveDateLabel: string;
  effectiveDate: string;
  children: ReactNode;
};

export default function LegalDocumentPage({
  pageTitle,
  effectiveDateLabel,
  effectiveDate,
  children,
}: Props) {
  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="card legal-page-card">
        <p className="legal-page-meta">
          <strong>{effectiveDateLabel}:</strong> {effectiveDate}
        </p>
        <div className="legal-page-copy">
          {children}
        </div>
      </div>
    </PageLayout>
  );
}
