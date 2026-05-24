import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReadingExerciseItem, ReadingSessionData, PreviousAnswer } from '../types';
import KeyboardTip from './KeyboardTip';
import JapaneseText from './JapaneseText';
import SessionProgressBar from './SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';
import { updateFeedbackDetails } from '../utils/feedback';
import { didConvertFromLatin, finalizeIME, ReadingExercisePicker, toHiraganaIME } from '../engines/readingExerciseEngine';
import ExerciseCompletedMessage from './ExerciseCompletedMessage';

type Props = {
  session: ReadingSessionData;
  persistKey: string;
  sectionTitle: string;
  acceptQuestionAsCorrect?: boolean;
  showPreviousAnswers?: boolean;
  largeAnswer?: boolean;
};

export default function ReadingExercise({
  session,
  persistKey,
  sectionTitle,
  acceptQuestionAsCorrect = false,
  showPreviousAnswers = false,
  largeAnswer = false,
}: Props) {
  const { t } = useTranslation();

  const items = session.items;
  const totalItems = items.length;

  const fingerprint = useMemo(
    () => buildExerciseFingerprint(persistKey, session.id, totalItems),
    [persistKey, session.id, totalItems],
  );
  const restoredDraft = useExerciseSessionDraft(persistKey, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);

  const pickerRef = useRef<ReadingExercisePicker>(new ReadingExercisePicker());
  const didRestorePickerRef = useRef(false);
  if (restoredDraft?.picker && !didRestorePickerRef.current) {
    pickerRef.current.restore(restoredDraft.picker);
    didRestorePickerRef.current = true;
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  const restoredIdx = restoredDraft?.currentIdx ?? 0;
  const [currentIdx, setCurrentIdx] = useState<number>(restoredIdx);
  const [currentItem, setCurrentItem] = useState<ReadingExerciseItem | null>(
    () => items[restoredIdx] ?? null,
  );
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);

  const [rawInput, setRawInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [didConvert, setDidConvert] = useState(false);

  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [revealAnswer, setRevealAnswer] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>(restoredDraft?.prevAnswers ?? []);

  const {
    segments: progressSegments,
    pulses: progressPulses,
    record: recordProgress,
    getState: getProgressState,
    getProgressSnapshot,
  } = useSessionProgress(totalItems, {
    persistKey,
    initialProgress: restoredDraft?.progress,
  });

  const { persistNow } = usePersistExerciseDraft(
    persistKey,
    fingerprint,
    () => ({
      progress: getProgressSnapshot(),
      picker: pickerRef.current.getState(),
      currentIdx,
      correct,
      incorrect,
      prevAnswers,
      isFinished,
    }),
    [currentIdx, correct, incorrect, isFinished, prevAnswers, progressSegments, getProgressSnapshot],
  );

  const pickNext = useCallback(() => {
    const nextIdx = pickerRef.current.pickNextIndex(totalItems, getProgressState);
    if (nextIdx === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setInputState('');
      setRevealAnswer('');
      setUserInput('');
      setRawInput('');
      setIsComposing(false);
      setDidConvert(false);
      setCurrentItem(null);
      return;
    }

    setIsFinished(false);
    setCurrentIdx(nextIdx);
    setCurrentItem(items[nextIdx] ?? null);
    setUserInput('');
    setRawInput('');
    setIsComposing(false);
    setDidConvert(false);
    setInputState('');
    setRevealAnswer('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [getProgressState, items, totalItems]);

  useEffect(() => {
    if (didInitPickRef.current) return;
    didInitPickRef.current = true;

    if (shouldRestoreSessionRef.current) {
      if (!isFinished) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    }
    pickerRef.current.reset();
    setIsFinished(false);
    setCorrect(0);
    setIncorrect(0);
    setPrevAnswers([]);
    pickNext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const prevSessionIdRef = useRef(session.id);
  useEffect(() => {
    if (prevSessionIdRef.current === session.id) return;
    prevSessionIdRef.current = session.id;
    shouldRestoreSessionRef.current = false;
    pickerRef.current.reset();
    setIsFinished(false);
    setCorrect(0);
    setIncorrect(0);
    setPrevAnswers([]);
    pickNext();
  }, [session.id, pickNext]);

  useEffect(() => {
    if (isFinished) {
      clearExerciseSessionDraft(persistKey);
    }
  }, [isFinished, persistKey]);

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
      return;
    }
    pendingCaretRef.current = null;
  }, [userInput]);

  useEffect(() => {
    if (!currentItem || isFinished) return;
    updateFeedbackDetails({
      section: sectionTitle,
      question: currentItem.question,
      correctAnswer: currentItem.answer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentItem, isFinished, sectionTitle, userInput]);

  const pct = useMemo(() => {
    return correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100;
  }, [correct, incorrect]);

  const checkAnswer = useCallback(() => {
    if (isFinished) return;
    if (!currentItem) return;

    const normalized = finalizeIME(userInput.trim());
    if (!normalized) return;

    const ok = normalized === currentItem.answer || (acceptQuestionAsCorrect && normalized === currentItem.question);

    if (ok) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    setRevealAnswer(currentItem.answer);
    setPrevAnswers(prev => [
      {
        question: currentItem.question,
        userAnswer: normalized,
        correctAnswer: currentItem.answer,
        isCorrect: ok,
      },
      ...prev,
    ]);

    recordProgress(String(currentIdx), ok);
    setAwaitingNext(true);
    persistNow();
  }, [acceptQuestionAsCorrect, currentIdx, currentItem, isFinished, recordProgress, userInput, persistNow]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isFinished) return;

    if (awaitingNext) {
      if (e.key === 'Enter') {
        e.preventDefault();
        pickNext();
        return;
      }
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        pickNext();
      }
      return;
    }

    if (e.key === 'Enter') {
      const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean };
      if (nativeEvent.isComposing) return;
      e.preventDefault();
      checkAnswer();
    }
  }, [awaitingNext, checkAnswer, isFinished, pickNext]);

  return (
    <>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
          <div className="form-hint">{t('readingExercise.prompt')}</div>

          <div className="exercise-question">
            <JapaneseText text={currentItem?.question ?? t('common.loading')} showFurigana={false} />
          </div>

          <div className="exercise-input-block">
            <input
              ref={inputRef}
              className={`exercise-input ${inputState}`}
              value={userInput}
              onChange={e => {
                if (awaitingNext) return;
                const raw = e.target.value;
                setRawInput(raw);

                const composing = isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
                if (composing) {
                  setDidConvert(false);
                  setIsComposing(true);
                  setUserInput(raw);
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
                setUserInput(converted);
              }}
              onCompositionStart={() => {
                isComposingRef.current = true;
                setIsComposing(true);
              }}
              onCompositionEnd={() => {
                isComposingRef.current = false;
                setIsComposing(false);
              }}
              onKeyDown={handleKeyDown}
              autoCorrect="off"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
            />
            <KeyboardTip preferred="latin" rawValue={rawInput} isComposing={isComposing} didConvert={didConvert} />
          </div>

          <div className={`answer-banner ${revealAnswer ? (inputState === 'correct' ? 'is-correct' : 'is-incorrect') : 'is-empty'}`}>
            {revealAnswer
              ? (largeAnswer
                ? <span className="is-japanese" style={{ fontSize: '1.4rem' }}>{revealAnswer}</span>
                : revealAnswer)
              : '\u00A0'}
          </div>
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

      {showPreviousAnswers && prevAnswers.length > 0 && (
        <div className="card prev-answers">
          <legend>{t('common.previousAnswers')}</legend>
          {prevAnswers.slice(0, 20).map((a, i) => (
            <div key={i} className={`prev-answer-item ${a.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
              <span className="icon">{a.isCorrect ? '✓' : '✗'}</span>
              <span className="q">{a.question}</span>
              <span className="user-ans">{a.userAnswer}</span>
              {!a.isCorrect && <span className="correct-ans">→ {a.correctAnswer}</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
