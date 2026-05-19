import { useState, useEffect } from 'react';
import { generateAnswers, matchesByRubyUnits, parseAnswerTemplate, pickBestDiff } from '../engines/sentenceEngine';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX } from '../types';
import { useTranslation } from 'react-i18next';

export default function DiffTestPage() {
  const { t, i18n } = useTranslation();
  const [correct, setCorrect] = useState('{私[わたし]は|}図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます');
  const [user, setUser] = useState('図書館で教科書を読みます');

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + t('diffTest.title');
  }, [i18n.language]);

  const parsedAlternatives = generateAnswers(parseAnswerTemplate(correct));
  const { ops } = pickBestDiff(user, parsedAlternatives);

  const isCorrect = parsedAlternatives.some(a => matchesByRubyUnits(user.trim(), a));

  const diffNode = (
    <div className="diff-display diff-answer" style={{ padding: 20, background: '#2a2d3d', borderRadius: 8, marginTop: 20 }}>
      {ops.map((op, idx) => {
        if (op.kind === 'extra') {
          return <span key={idx} className="diff-char diff-deleted">{op.text}</span>;
        }

        const { unit, status } = op;
        if (unit.kind === 'plain') {
          return (
            <span key={idx} className={`diff-char ${status === 'missing' ? 'diff-missing' : 'diff-correct'}`}>
              {unit.surface}
            </span>
          );
        }

        const kanjiClass =
          status === 'correct_kanji' ? 'diff-correct'
            : status === 'correct_kana' ? 'diff-kanji-kana'
              : 'diff-missing';
        const rtClass = status === 'missing' ? 'diff-missing' : 'diff-correct';

        return (
          <ruby key={idx} className={kanjiClass}>
            {unit.surface}
            <rt className={rtClass}>{unit.reading}</rt>
          </ruby>
        );
      })}
    </div>
  );

  return (
    <div className="app-container">
      <div className="page-actions">
        <Link to="/" className="header-btn" aria-label={t('common.back')}>{'<'}</Link>
      </div>
      <div className="page-header">
        <h1 className="page-heading">{t('diffTest.title')}</h1>
      </div>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' }}>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{t('diffTest.correctAnswer')}</div>
            <input
              className="exercise-input"
              value={correct}
              onChange={e => setCorrect(e.target.value)}
              style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{t('diffTest.userInput')}</div>
            <input
              className="exercise-input"
              value={user}
              onChange={e => setUser(e.target.value)}
              style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
            />
          </label>
        </div>

        {diffNode}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            fontSize: '32px',
            color: isCorrect ? 'var(--correct)' : 'var(--incorrect)',
            transition: 'all 0.3s ease',
          }}
        >
          <span>{isCorrect ? '✓' : '✗'}</span>
        </div>
      </div>


      <div style={{ marginTop: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{t('diffTest.heading')}</div>
        <div>
          {t('diffTest.body1')}
        </div>
        <div style={{ marginTop: 10 }}>
          {t('diffTest.body2')}{' '}
          {'{私[わたし]|僕[ぼく]}'}
          .
        </div>
      </div>

    </div>
  );
}
