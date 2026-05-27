import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DiffPlayground } from '../src/react/DiffPlayground';
import '../src/react/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <div style={{ minHeight: '100vh', background: '#1a1b26', color: '#c0caf5', fontFamily: 'system-ui, sans-serif' }}>
      <DiffPlayground
        showHtmlPreview
        labels={{
          title: 'tenshindiff',
          correct: 'Answer template',
          user: 'Your answer',
        }}
      />
      <p style={{ textAlign: 'center', fontSize: 13, color: '#565f89', padding: '0 16px 24px' }}>
        Furigana 漢[かん], alternatives {'{A|B}'}, optional {'{primary|}'}, kana vs kanji diff
      </p>
    </div>
  </StrictMode>,
);
