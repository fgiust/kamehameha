import { useState, useEffect, useRef } from 'react';
import {
  generateAnswersFromTemplate,
  matchesByRubyUnits,
  pickBestDiff,
  primarySurfaceFromTemplate,
} from 'tenshindiff';
import { SENTENCE_DIFF_OPTIONS } from '../utils/sentenceDiffOptions';
import { didConvertFromLatin, toHiraganaIME } from '../engines/readingExerciseEngine';
import { useTranslation } from 'react-i18next';
import { useDebugMode } from '../hooks/useDebugMode';
import KeyboardTip from './KeyboardTip';
import DiffDisplay from './DiffDisplay';
import AnswerTemplatePreview from './AnswerTemplatePreview';
import CopyAsTestcaseLink from './CopyAsTestcaseLink';

export default function DiffTestModal({
  isOpen,
  onClose,
  initialCorrect = '{私[わたし]は|}図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます',
  initialUser = '図書館で教科書を読みます',
}: {
  isOpen: boolean;
  onClose: () => void;
  initialCorrect?: string;
  initialUser?: string;
}) {
  const { t } = useTranslation();
  const debugMode = useDebugMode();
  const showCopyTestcase = import.meta.env.DEV && debugMode;
  const [correct, setCorrect] = useState(initialCorrect);
  const [user, setUser] = useState(initialUser);
  const [rawUser, setRawUser] = useState(initialUser);
  const [isComposing, setIsComposing] = useState(false);
  const [didConvert, setDidConvert] = useState(false);

  const userInputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setCorrect(initialCorrect);
      const preloaded = initialUser.trim() || primarySurfaceFromTemplate(initialCorrect, SENTENCE_DIFF_OPTIONS);
      setUser(preloaded);
      setRawUser(preloaded);
      setIsComposing(false);
      setDidConvert(false);
      isComposingRef.current = false;
      pendingCaretRef.current = null;
    }
  }, [isOpen, initialCorrect, initialUser]);

  useEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos === null) return;
    const el = userInputRef.current;
    if (!el) return;
    if (document.activeElement !== el) {
      pendingCaretRef.current = null;
      return;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      return;
    }
    pendingCaretRef.current = null;
  }, [user]);

  if (!isOpen) return null;

  const parsedAlternatives = generateAnswersFromTemplate(correct, SENTENCE_DIFF_OPTIONS);
  const { bestAnswer, ops } = pickBestDiff(user, parsedAlternatives);
  const isCorrect = parsedAlternatives.some(a => matchesByRubyUnits(user.trim(), a));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="feedback-panel-header">
          <h3 style={{ margin: 0 }}>{t('diffTest.title')}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('sentenceEdit.cancel')}>
            ×
          </button>
        </div>

        <div className="card" style={{ boxShadow: 'none', padding: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{t('diffTest.correctAnswer')}</div>
              <input
                className="exercise-input"
                value={correct}
                onChange={e => setCorrect(e.target.value)}
                style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
                spellCheck={false}
              />
              <AnswerTemplatePreview template={correct} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{t('diffTest.userInput')}</div>
              <div className="exercise-input-block" style={{ width: '100%' }}>
                <input
                  ref={userInputRef}
                  className="exercise-input"
                  value={user}
                  onChange={e => {
                    const raw = e.target.value;
                    setRawUser(raw);

                    const composing =
                      isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
                    if (composing) {
                      setDidConvert(false);
                      setIsComposing(true);
                      setUser(raw);
                      return;
                    }
                    setIsComposing(false);

                    const didConvertNow = didConvertFromLatin(raw);
                    setDidConvert(didConvertNow);

                    const caret = e.target.selectionStart;
                    const converted = toHiraganaIME(raw);
                    if (caret !== null) {
                      pendingCaretRef.current = toHiraganaIME(raw.slice(0, caret)).length;
                    }
                    setUser(converted);
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                    setIsComposing(true);
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                    setIsComposing(false);
                  }}
                  style={{ width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <KeyboardTip preferred="japanese" rawValue={rawUser} isComposing={isComposing} didConvert={didConvert} />
              </div>
            </label>
          </div>

          <div className="diff-test-output">
            <DiffDisplay
              ops={ops}
              className="diff-answer"
              style={{ padding: 20, background: '#2a2d3d', borderRadius: 8, marginTop: 20 }}
            />
            {showCopyTestcase && (
              <CopyAsTestcaseLink bestAnswer={bestAnswer} user={user} ops={ops} isCorrect={isCorrect} />
            )}
          </div>

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

        <div
          style={{
            marginTop: 18,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            padding: '0 10px 10px 10px',
            textAlign: 'center',
            fontSize: '13px',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{t('diffTest.heading')}</div>
          <div>{t('diffTest.body1')}</div>
          <div style={{ marginTop: 4 }}>
            {t('diffTest.body2')} {'{私[わたし]|僕[ぼく]}'}.
          </div>
        </div>
      </div>
    </div>
  );
}
