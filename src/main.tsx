import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'tenshindiff/styles.css';
import './styles/index.css';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
