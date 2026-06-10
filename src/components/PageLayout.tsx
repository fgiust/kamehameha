import type { ReactNode } from 'react';
import BackButton from './BackButton';

type Props = {
  pageTitle: string;
  intro?: string;
  children: ReactNode;
};

export default function PageLayout({ pageTitle, intro, children }: Props) {
  return (
    <div className="app-container">
      <div className="page-actions">
        <BackButton />
      </div>

      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
        {intro ? <p className="page-intro">{intro}</p> : null}
      </div>

      {children}

    </div>
  );
}
