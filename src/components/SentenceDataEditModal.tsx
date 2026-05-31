import { useEffect, useRef, useState } from 'react';
import {
  generateAnswersFromTemplate,
  matchesByRubyUnits,
  pickBestDiff,
  primarySurfaceFromTemplate,
} from 'tenshindiff';
import { SENTENCE_DIFF_OPTIONS } from '../utils/sentenceDiffOptions';
import { didConvertFromLatin, toHiraganaIME } from '../engines/readingExerciseEngine';
import { useTranslation } from 'react-i18next';
import type { SentenceItem } from '../types';
import { saveSentenceBlock } from '../api/devSentenceBlock';
import { lessonIdToDataFile } from '../lessons/lessonDataFile';
import { useAnswerTemplateIssues } from './AnswerTemplateValidation';
import AnswerTemplatePreview from './AnswerTemplatePreview';
import DiffDisplay from './DiffDisplay';
import KeyboardTip from './KeyboardTip';
import CopyAsTestcaseLink from './CopyAsTestcaseLink';

export type SentenceDataEditSaved = {
  english: string;
  italian: string;
  answer: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dataLessonId: string;
  blockIndex: number;
  item: SentenceItem;
  userInput: string;
  onSaved: (updated: SentenceDataEditSaved) => void;
}

export default function SentenceDataEditModal({
  isOpen,
  onClose,
  dataLessonId,
  blockIndex,
  item,
  userInput,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [english, setEnglish] = useState(item.english);
  const [italian, setItalian] = useState(item.italian ?? '');
  const [answer, setAnswer] = useState(item.answer);
  const [testUser, setTestUser] = useState('');
  const [rawUser, setRawUser] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [didConvert, setDidConvert] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const userInputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  const answerIssues = useAnswerTemplateIssues(answer);
  const canSave = answerIssues.length === 0 && !saving;

  useEffect(() => {
    if (!isOpen) return;
    setEnglish(item.english);
    setItalian(item.italian ?? '');
    setAnswer(item.answer);
    const preloaded = userInput.trim() || primarySurfaceFromTemplate(item.answer);
    setTestUser(preloaded);
    setRawUser(preloaded);
    setIsComposing(false);
    setDidConvert(false);
    setSaveError(null);
    isComposingRef.current = false;
    pendingCaretRef.current = null;
  }, [isOpen, item, userInput]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

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
  }, [testUser]);

  if (!isOpen) return null;

  const parsedAlternatives = generateAnswersFromTemplate(answer, SENTENCE_DIFF_OPTIONS);
  const { ops } = pickBestDiff(testUser, parsedAlternatives);
  const isCorrect = parsedAlternatives.some(a => matchesByRubyUnits(testUser.trim(), a));

  const fileName = lessonIdToDataFile(dataLessonId);

  const handleSave = async () => {
    if (!canSave || !fileName) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveSentenceBlock({
        fileName,
        blockIndex,
        english,
        italian,
        answer,
      });
      onSaved({ english, italian, answer });
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : t('sentenceEdit.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content sentence-edit-modal" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn sentence-edit-close"
          onClick={onClose}
          aria-label={t('sentenceEdit.cancel')}
        >
          ×
        </button>

        <h3 className="sentence-edit-title">{t('sentenceEdit.title')}</h3>
        <p className="sentence-edit-file-hint">
          {t('sentenceEdit.fileHint', { file: fileName ?? '', index: blockIndex + 1 })}
        </p>

        <div className="sentence-edit-body">
          <div className="sentence-edit-fields">
            <textarea
              className="exercise-input sentence-edit-textarea"
              value={english}
              onChange={e => setEnglish(e.target.value)}
              rows={2}
            />
            <textarea
              className="exercise-input sentence-edit-textarea"
              value={italian}
              onChange={e => setItalian(e.target.value)}
              rows={2}
            />
            <div className="sentence-edit-answer-block">
              <textarea
                className="exercise-input sentence-edit-textarea sentence-edit-answer"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={3}
                spellCheck={false}
              />
              <AnswerTemplatePreview template={answer} />
            </div>
            <div className="exercise-input-block sentence-edit-test-block">
              <input
                ref={userInputRef}
                className="exercise-input"
                value={testUser}
                onChange={e => {
                  const raw = e.target.value;
                  setRawUser(raw);
                  const composing =
                    isComposingRef.current ||
                    (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
                  if (composing) {
                    setDidConvert(false);
                    setIsComposing(true);
                    setTestUser(raw);
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
                  setTestUser(converted);
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                  setIsComposing(true);
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                  setIsComposing(false);
                }}
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
              />
              <KeyboardTip preferred="japanese" rawValue={rawUser} isComposing={isComposing} didConvert={didConvert} />
            </div>
          </div>

          <div className="diff-test-output">
            <DiffDisplay ops={ops} className="diff-answer sentence-edit-diff" />
            <CopyAsTestcaseLink template={answer} user={testUser} ops={ops} isCorrect={isCorrect} />
          </div>

          <div
            className="sentence-edit-diff-result"
            style={{ color: isCorrect ? 'var(--correct)' : 'var(--incorrect)' }}
            aria-live="polite"
          >
            {isCorrect ? '✓' : '✗'}
          </div>

          {saveError && <p className="sentence-edit-error">{saveError}</p>}

          <div className="sentence-edit-actions">
            <button type="button" className="sentence-edit-save" onClick={handleSave} disabled={!canSave || saving}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
                />
              </svg>
              <span>{saving ? t('sentenceEdit.saving') : t('sentenceEdit.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
