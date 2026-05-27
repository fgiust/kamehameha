import { useEffect, useState } from 'react';
import { pickBestDiff } from '../diff';
import { renderDiffHtml } from '../render';
import { matchesByRubyUnits } from '../ruby';
import { generateAnswers, parseAnswerTemplate, primarySurfaceFromTemplate } from '../template';
import { DiffDisplay } from './DiffDisplay';

export const DEMO_CORRECT =
  '{私[わたし]は|}図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます';
export const DEMO_USER = '図書館で教科書を読みます';

export type DiffPlaygroundProps = {
  correct?: string;
  user?: string;
  onCorrectChange?: (value: string) => void;
  onUserChange?: (value: string) => void;
  convertInput?: (raw: string) => string;
  labels?: {
    correct?: string;
    user?: string;
    title?: string;
  };
  showHtmlPreview?: boolean;
};

export function DiffPlayground({
  correct: controlledCorrect,
  user: controlledUser,
  onCorrectChange,
  onUserChange,
  convertInput,
  labels = {},
  showHtmlPreview = false,
}: DiffPlaygroundProps) {
  const [correct, setCorrect] = useState(controlledCorrect ?? DEMO_CORRECT);
  const [user, setUser] = useState(controlledUser ?? DEMO_USER);

  useEffect(() => {
    if (controlledCorrect !== undefined) setCorrect(controlledCorrect);
  }, [controlledCorrect]);

  useEffect(() => {
    if (controlledUser !== undefined) setUser(controlledUser);
  }, [controlledUser]);

  const setCorrectValue = (value: string) => {
    setCorrect(value);
    onCorrectChange?.(value);
  };

  const setUserValue = (value: string) => {
    setUser(value);
    onUserChange?.(value);
  };

  const parsedAlternatives = generateAnswers(parseAnswerTemplate(correct));
  const { ops } = pickBestDiff(user, parsedAlternatives);
  const isCorrect = parsedAlternatives.some(a => matchesByRubyUnits(user.trim(), a));
  const html = renderDiffHtml(ops, { className: 'diff-answer' });

  return (
    <div className="tenshindiff-playground" style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      {labels.title ? (
        <h1 style={{ fontSize: 20, marginBottom: 16, textAlign: 'center' }}>{labels.title}</h1>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{labels.correct ?? 'Correct answer template'}</span>
          <input
            value={correct}
            onChange={e => setCorrectValue(e.target.value)}
            spellCheck={false}
            style={{ width: '100%', padding: 8, fontSize: 16, boxSizing: 'border-box' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{labels.user ?? 'Your answer'}</span>
          <input
            value={user}
            onChange={e => {
              const raw = e.target.value;
              setUserValue(convertInput ? convertInput(raw) : raw);
            }}
            spellCheck={false}
            style={{ width: '100%', padding: 8, fontSize: 16, boxSizing: 'border-box' }}
          />
          <button
            type="button"
            style={{ alignSelf: 'flex-start', fontSize: 13 }}
            onClick={() => setUserValue(primarySurfaceFromTemplate(correct))}
          >
            Reset to primary surface
          </button>
        </label>

        <DiffDisplay
          ops={ops}
          className="diff-answer"
          style={{ padding: 16, background: '#2a2d3d', borderRadius: 8 }}
        />

        <div style={{ textAlign: 'center', fontSize: 32, color: isCorrect ? 'var(--correct, #4ade80)' : 'var(--incorrect, #f87171)' }}>
          {isCorrect ? '✓' : '✗'}
        </div>

        {showHtmlPreview ? (
          <details>
            <summary style={{ cursor: 'pointer' }}>renderDiffHtml output</summary>
            <pre
              style={{
                marginTop: 8,
                padding: 8,
                background: '#1e1e2e',
                borderRadius: 4,
                overflow: 'auto',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {html}
            </pre>
            <div style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: html }} />
          </details>
        ) : null}
      </div>
    </div>
  );
}
