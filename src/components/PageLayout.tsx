import type { ReactNode } from 'react';

type Props = {
  pageTitle: string;
  children: ReactNode;
};

export default function PageLayout({ pageTitle, children }: Props) {
  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
      </div>

      {children}
    </div>
  );
}
