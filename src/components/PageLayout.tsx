import type { ReactNode } from 'react';
import BackButton from './BackButton';

type Props = {
  pageTitle: string;
  children: ReactNode;
};

export default function PageLayout({ pageTitle, children }: Props) {
  return (
    <div className="app-container">
      <div className="page-actions">
        <BackButton />
      </div>

      {children}

      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
      </div>
    </div>
  );
}
