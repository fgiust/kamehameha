import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { ProgressSyncProvider } from './progress/ProgressSyncProvider';
import 'tenshindiff/styles.css';
import './styles/fonts.css';
import './styles/index.css';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ProgressSyncProvider>
        <App />
      </ProgressSyncProvider>
    </AuthProvider>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
