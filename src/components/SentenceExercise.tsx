import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, SentenceItem, PreviousAnswer } from '../types';
import type { DiffUnitOp } from 'tenshindiff';
import { diffSentenceAnswer, generateAnswersFromTemplate, matchesByRubyUnits, pickBestDiff, stripRuby } from 'tenshindiff';
import { SENTENCE_DIFF_OPTIONS } from '../utils/sentenceDiffOptions';
import DiffDisplay from './DiffDisplay';
import { toHiragana } from 'wanakana';
import SessionProgressBar from './SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';
import KeyboardTip from './KeyboardTip';
import { useTranslation } from 'react-i18next';
import PageLayout from './PageLayout';
import ExerciseCompletedMessage from './ExerciseCompletedMessage';
import AlternateLanguageLine from './AlternateLanguageLine';
import { useDebugMode } from '../hooks/useDebugMode';
import { getSentencePrompts, resolveUiLang } from '../utils/bilingualPrompt';
import { isEditableSentenceLesson } from '../lessons/lessonDataFile';
import SentenceDataEditModal from './SentenceDataEditModal';

interface Props {
  title: string;
  sentenceData: SentenceItem[];
  persistKey?: string;
  /** Session id for genki/sentence txt lessons (enables dev data editor). */
  dataLessonId?: string;
}

function toHiraganaIME(raw: string) {
  const trailingSingleN = /([^n])n$/i.test(raw) || /^n$/i.test(raw);
  let s = raw.replace(/nn(?=[aiueoy])/gi, "n'n");
  if (/nn$/i.test(s)) s = s.slice(0, -1);
  const out = toHiragana(s);
  if (trailingSingleN && out.endsWith('ん')) return out.slice(0, -1) + 'n';
  return out;
}

function finalizeIME(input: string) {
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(input)) return input;
  if (input.endsWith('n')) return input.slice(0, -1) + 'ん';
  return input;
}

function hasJapaneseChars(text: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

function hasLatinLetters(text: string) {
  return /[A-Za-z]/.test(text);
}

function isLatinImeChar(ch: string) {
  return /[A-Za-z'-]/.test(ch);
}

export default function SentenceExercise({ title, sentenceData, persistKey, dataLessonId }: Props) {
  const { t, i18n } = useTranslation();
  const lang = resolveUiLang(i18n.resolvedLanguage ?? i18n.language);
  const debugMode = useDebugMode();
  const [sentenceItems, setSentenceItems] = useState(sentenceData);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const canEditSentenceData =
    import.meta.env.DEV && debugMode && isEditableSentenceLesson(dataLessonId);

  useEffect(() => {
    setSentenceItems(sentenceData);
  }, [sentenceData]);

  const fingerprint = useMemo(
    () => buildExerciseFingerprint(persistKey ?? title, sentenceItems.length),
    [persistKey, title, sentenceItems.length],
  );
  const restoredDraft = useExerciseSessionDraft(persistKey, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);

  const [currentIdx, setCurrentIdx] = useState(restoredDraft?.currentIdx ?? 0);
  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);

  useEffect(() => {
    if (isFinished) setEditModalOpen(false);
  }, [isFinished]);

  const [answerFeedback, setAnswerFeedback] = useState<null | {
    isCorrect: boolean;
    userAnswer: string;
    displayAnswer: string;
    ops: ReturnType<typeof diffSentenceAnswer>;
  }>(null);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>(restoredDraft?.prevAnswers ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const lastRawValueRef = useRef('');
  const remainingIdxRef = useRef<number[]>(restoredDraft?.picker.remainingIdx ?? []);
  const lastIdxRef = useRef<number | null>(restoredDraft?.picker.lastIdx ?? null);
  const phaseRef = useRef<0 | 2 | null>(restoredDraft?.picker.phase ?? null);
  const {
    segments: progressSegments,
    pulses: progressPulses,
    record: recordProgress,
    getState: getProgressState,
    getProgressSnapshot,
  } = useSessionProgress(sentenceItems.length, {
    persistKey,
    initialProgress: restoredDraft?.progress,
  });

  const { persistNow } = usePersistExerciseDraft(
    persistKey,
    fingerprint,
    () => ({
      progress: getProgressSnapshot(),
      picker: {
        remainingIdx: [...remainingIdxRef.current],
        phase: phaseRef.current,
        lastIdx: lastIdxRef.current,
      },
      currentIdx,
      correct,
      incorrect,
      prevAnswers,
      isFinished,
    }),
    [currentIdx, correct, incorrect, isFinished, prevAnswers, progressSegments, getProgressSnapshot],
  );

  const currentItem = sentenceItems[currentIdx];
  const { primary: promptText, alternate: alternatePromptText } = getSentencePrompts(currentItem, lang);

  const pickNext = useCallback(() => {
    if (sentenceItems.length === 0) return;

    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < sentenceItems.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setAnswerFeedback(null);
      setInputState('');
      return;
    }

    setIsFinished(false);

    if (phaseRef.current !== nextPhase || remainingIdxRef.current.length === 0) {
      remainingIdxRef.current = (nextPhase === 0 ? unanswered : incorrect).slice();
      phaseRef.current = nextPhase;
    }

    const pool = remainingIdxRef.current;
    let pickIndex = Math.floor(Math.random() * pool.length);

    const last = lastIdxRef.current;
    if (last !== null && pool.length > 1 && pool[pickIndex] === last) {
      pickIndex = (pickIndex + 1) % pool.length;
    }

    const nextIdx = pool.splice(pickIndex, 1)[0]!;
    lastIdxRef.current = nextIdx;

    setCurrentIdx(nextIdx);
    setUserInput('');
    setRawInput('');
    setDidConvert(false);
    lastRawValueRef.current = '';
    setInputState('');
    setAnswerFeedback(null);
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [sentenceItems.length, getProgressState]);

  useEffect(() => {
    if (didInitPickRef.current) return;
    didInitPickRef.current = true;

    if (shouldRestoreSessionRef.current) {
      if (!isFinished) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    }
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    setIsFinished(false);
    pickNext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFinished && persistKey) {
      clearExerciseSessionDraft(persistKey);
    }
  }, [isFinished, persistKey]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + title;
  }, [title]);

  // Update feedback details globally
  useEffect(() => {
    if (!currentItem || isFinished) return;

    updateFeedbackDetails({
      section: title,
      question: promptText,
      questionAlt: alternatePromptText,
      correctAnswer: currentItem.answer,
      rawCorrectAnswer: currentItem.answer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentItem, title, userInput, isFinished, promptText, alternatePromptText]);

  useEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos === null) return;
    const el = inputRef.current;
    if (!el) return;
    if (document.activeElement !== el) {
      pendingCaretRef.current = null;
      return;
    }
    try {
      el.setSelectionRange(pos, pos);
    } catch {
      // ignore
    }
    pendingCaretRef.current = null;
  }, [userInput]);

  const advanceToNext = useCallback(() => {
    setAwaitingNext(false);
    pickNext();
  }, [pickNext]);

  const checkAnswer = useCallback(() => {
    if (awaitingNext) return;
    if (isFinished) return;
    if (!currentItem || !userInput.trim()) return;
    const normalized = finalizeIME(userInput.trim());
    const rawAnswers = generateAnswersFromTemplate(currentItem.answer, SENTENCE_DIFF_OPTIONS);
    const isCorrect = rawAnswers.some(a => matchesByRubyUnits(normalized, a));
    const { bestAnswer: displayAnswer, ops } = pickBestDiff(normalized, rawAnswers);

    if (isCorrect) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    setAnswerFeedback({
      isCorrect,
      userAnswer: normalized,
      displayAnswer,
      ops,
    });

    setPrevAnswers(prev => [{
      question: promptText,
      userAnswer: normalized,
      correctAnswer: stripRuby(displayAnswer),
      isCorrect,
      displayAnswer,
      diffOps: ops,
    }, ...prev]);

    recordProgress(String(currentIdx), isCorrect);
    setAwaitingNext(true);
    persistNow();
  }, [awaitingNext, currentItem, userInput, promptText, recordProgress, currentIdx, isFinished, persistNow]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished) return;
    if (awaitingNext) {
      if (e.key === 'Enter') {
        e.preventDefault();
        advanceToNext();
        return;
      }
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        advanceToNext();
      }
      return;
    }

    if (e.key === 'Enter') {
      const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean };
      if (isComposingRef.current || nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      checkAnswer();
    }
  };

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  const diffNode = (() => {
    if (!answerFeedback) return null;
    return <DiffDisplay ops={answerFeedback.ops} className="diff-answer" />;
  })();

  return (
    <PageLayout pageTitle={title}>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
              <div className="exercise-prompt">{t('sentenceExercise.promptTranslate')}</div>
              <div
                className={`exercise-question${debugMode && alternatePromptText ? ' has-alt-prompt' : ''}`}
                style={{ fontSize: 20, fontFamily: 'Open Sans, sans-serif' }}
              >
                <span className="exercise-question-main">{promptText}</span>
                {debugMode && (
                  <AlternateLanguageLine text={alternatePromptText} className="exercise-question-alt" />
                )}
              </div>
              <div className="exercise-input-block">
                <div className="exercise-input-row">
                  <input
                    ref={inputRef}
                    className={`exercise-input ${inputState}`}
                    value={userInput}
                  onChange={e => {
                    if (awaitingNext) return;
                    const raw = e.target.value;
                    setRawInput(raw);
                    const caret = e.target.selectionStart;
                    const composing = isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
                    if (composing) {
                      setDidConvert(false);
                      setIsComposing(true);
                      setUserInput(raw);
                      lastRawValueRef.current = raw;
                      return;
                    }

                    setIsComposing(false);

                    const prev = lastRawValueRef.current;
                    let prefixLen = 0;
                    const minLen = Math.min(prev.length, raw.length);
                    while (prefixLen < minLen && prev[prefixLen] === raw[prefixLen]) prefixLen++;

                    let suffixLen = 0;
                    while (
                      suffixLen < (prev.length - prefixLen) &&
                      suffixLen < (raw.length - prefixLen) &&
                      prev[prev.length - 1 - suffixLen] === raw[raw.length - 1 - suffixLen]
                    ) {
                      suffixLen++;
                    }

                    let convertStart = prefixLen;
                    while (convertStart > 0 && isLatinImeChar(raw[convertStart - 1] ?? '') && !hasJapaneseChars(raw[convertStart - 1] ?? '')) {
                      convertStart--;
                    }

                    const convertEnd = raw.length - suffixLen;
                    const segment = raw.slice(convertStart, convertEnd);

                    if (hasLatinLetters(segment) && !hasJapaneseChars(segment)) {
                      setDidConvert(true);
                      const convertedSegment = toHiraganaIME(segment);
                      const nextValue = raw.slice(0, convertStart) + convertedSegment + raw.slice(convertEnd);
                      if (caret !== null) {
                        const caretSegment = raw.slice(convertStart, caret);
                        pendingCaretRef.current = convertStart + toHiraganaIME(caretSegment).length;
                      }
                      setUserInput(nextValue);
                      lastRawValueRef.current = nextValue;
                      return;
                    }

                    setDidConvert(false);
                    if (caret !== null) pendingCaretRef.current = caret;
                    setUserInput(raw);
                    lastRawValueRef.current = raw;
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                    setIsComposing(true);
                  }}
                  onCompositionEnd={e => {
                    isComposingRef.current = false;
                    setIsComposing(false);
                    lastRawValueRef.current = e.currentTarget.value;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  />
                  {canEditSentenceData && dataLessonId && (
                    <button
                      type="button"
                      className="sentence-edit-pen-btn"
                      onClick={() => setEditModalOpen(true)}
                      aria-label={t('sentenceExercise.editData')}
                      title={t('sentenceExercise.editData')}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <KeyboardTip preferred="japanese" rawValue={rawInput} isComposing={isComposing} didConvert={didConvert} />
              </div>
              {diffNode}
            </>
          )}
        </div>
      </div>
      <SessionProgressBar
        segments={progressSegments}
        pulses={progressPulses}
        correct={correct}
        incorrect={incorrect}
        pct={pct}
      />

      {!isFinished && canEditSentenceData && dataLessonId && currentItem && (
        <SentenceDataEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          dataLessonId={dataLessonId}
          blockIndex={currentIdx}
          item={currentItem}
          userInput={userInput}
          onSaved={updated => {
            setSentenceItems(prev =>
              prev.map((row, i) => (i === currentIdx ? { ...row, ...updated } : row)),
            );
          }}
        />
      )}

      {prevAnswers.length > 0 && (
        <div className="card prev-answers prev-answers-diff">
          <legend>{t('common.previousAnswers')}</legend>
          {prevAnswers.slice(0, 20).map((a, i) => (
            <div key={i} className={`prev-answer-item prev-answer-item-diff ${a.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
              <span className="icon">{a.isCorrect ? '✓' : '✗'}</span>
              <div className="prev-answer-body">
                <div className="prev-answer-q">{a.question}</div>
                {Array.isArray(a.diffOps) && (
                  <DiffDisplay ops={a.diffOps as DiffUnitOp[]} className="diff-history" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
