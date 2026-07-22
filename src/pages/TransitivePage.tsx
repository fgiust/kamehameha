import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';
import { matchesByRubyUnits, stripRuby, toKana } from 'tenshindiff';
import { toHiragana } from 'wanakana';
import { transitiveData, VerbPair } from '../data/dictTransitivePairs';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { updateFeedbackDetails } from '../utils/feedback';
import { exerciseAnswerInputProps } from '../utils/exerciseInputProps';
import { handleAwaitingNextKey } from '../utils/awaitingNextKeys';
import { useAnswerUndoneBanner } from '../hooks/useAnswerUndoneBanner';
import AnswerUndoneBanner from '../components/AnswerUndoneBanner';
import { PreviousAnswer, SETTINGS_KEYS } from '../types';
import { readStoredConjugationDisplaySettings, writeStoredBool } from '../utils/utils';
import JapaneseText from '../components/JapaneseText';
import OptionToggle from '../components/OptionToggle';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import ExerciseCompletedMessage from '../components/ExerciseCompletedMessage';

function toHiraganaIME(raw: string) {
  const trailingSingleN = /([^n])n$/i.test(raw) || /^n$/i.test(raw);
  let s = raw.replace(/nn(?=[aiueoy])/gi, "n'n");
  if (/nn$/i.test(s)) s = s.slice(0, -1);
  const out = toHiragana(s);
  if (trailingSingleN && out.endsWith('ん')) return out.slice(0, -1) + 'n';
  return out;
}

function finalizeIME(input: string) {
  if (input.endsWith('n')) return input.slice(0, -1) + 'ん';
  return input;
}

const PERSIST_KEY = '/transitive';

export default function TransitivePage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const pageTitle = t('pages.transitive.title');
  const fingerprint = useMemo(
    () => buildExerciseFingerprint(PERSIST_KEY, transitiveData.length),
    [],
  );
  const restoredDraft = useExerciseSessionDraft(PERSIST_KEY, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);
  const restoredIdx = restoredDraft?.currentIdx ?? 0;
  const [currentIdx, setCurrentIdx] = useState<number>(restoredIdx);
  const [currentPair, setCurrentPair] = useState<VerbPair | null>(
    () => transitiveData[restoredIdx] ?? null,
  );
  const [askTransitive, setAskTransitive] = useState(
    () => restoredDraft?.extras?.askTransitive === false ? false : true,
  );
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);
  const [userInput, setUserInput] = useState('');
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [diffDisplay, setDiffDisplay] = useState<string>('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [undoFlash, setUndoFlash] = useState(false);
  const { undoneBanner, showUndoneBanner } = useAnswerUndoneBanner();
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>(restoredDraft?.prevAnswers ?? []);
  const [showFurigana, setShowFurigana] = useState(
    () => readStoredConjugationDisplaySettings().showFurigana,
  );

  const updateShowFurigana = useCallback((value: boolean) => {
    setShowFurigana(value);
    writeStoredBool(SETTINGS_KEYS.showFurigana, value);
  }, []);

  const toggleFurigana = useCallback(() => {
    setShowFurigana(prev => {
      const next = !prev;
      writeStoredBool(SETTINGS_KEYS.showFurigana, next);
      return next;
    });
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const remainingIdxRef = useRef<number[]>(restoredDraft?.picker.remainingIdx ?? []);
  const lastIdxRef = useRef<number | null>(restoredDraft?.picker.lastIdx ?? null);
  const phaseRef = useRef<0 | 2 | null>(restoredDraft?.picker.phase ?? null);

  const totalPairs = transitiveData.length;
  const {
    segments: progressSegments,
    pulses: progressPulses,
    record: recordProgress,
    unrecord: unrecordProgress,
    getState: getProgressState,
    getProgressSnapshot,
  } = useSessionProgress(totalPairs, {
    persistKey: PERSIST_KEY,
    initialProgress: restoredDraft?.progress,
  });

  usePersistExerciseDraft(
    PERSIST_KEY,
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
      extras: { askTransitive },
    }),
    [askTransitive, correct, currentIdx, incorrect, isFinished, prevAnswers, progressSegments, getProgressSnapshot],
  );

  const pickPair = useCallback(() => {
    if (transitiveData.length === 0) return;

    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < transitiveData.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setInputState('');
      setDiffDisplay('');
      setUserInput('');
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
    const pair = transitiveData[nextIdx]!;
    setCurrentPair(pair);
    setAskTransitive(Math.random() < 0.5);
    setUserInput('');
    setInputState('');
    setDiffDisplay('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [getProgressState]);

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
    pickPair();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFinished) clearExerciseSessionDraft(PERSIST_KEY);
  }, [isFinished]);

  // Update feedback details globally
  useEffect(() => {
    if (!currentPair || isFinished) return;
    const questionWord = askTransitive ? currentPair.i : currentPair.t;
    const targetWord = askTransitive ? currentPair.t : currentPair.i;

    const expectedTargetKanji = stripRuby(targetWord.verb);
    const expectedTargetHiragana = toKana(targetWord.verb);

    updateFeedbackDetails({
      section: pageTitle,
      question: t('transitive.feedbackQuestion', {
        verb: stripRuby(questionWord.verb),
        meaning: questionWord[lang],
        ask: askTransitive ? t('transitive.transitive') : t('transitive.intransitive'),
      }),
      correctAnswer: t('transitive.feedbackCorrectAnswer', {
        kana: expectedTargetHiragana,
        kanji: expectedTargetKanji,
        meaning: targetWord[lang],
      }),
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentPair, askTransitive, userInput, isFinished, pageTitle, t, lang]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !e.repeat) {
        toggleFurigana();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleFurigana]);

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
    pickPair();
  }, [pickPair]);

  const undoWrongAnswer = useCallback(() => {
    if (!awaitingNext || inputState !== 'incorrect') return;
    setAwaitingNext(false);
    setIncorrect(c => Math.max(0, c - 1));
    setInputState('');
    setDiffDisplay('');
    setPrevAnswers(prev => prev.slice(1));
    unrecordProgress(String(currentIdx));
    setUndoFlash(true);
    window.setTimeout(() => setUndoFlash(false), 550);
    showUndoneBanner();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [awaitingNext, currentIdx, inputState, showUndoneBanner, unrecordProgress]);

  const checkAnswer = () => {
    if (isFinished) return;
    if (!currentPair) return;
    const questionWord = askTransitive ? currentPair.i : currentPair.t;
    const targetWord = askTransitive ? currentPair.t : currentPair.i;

    const expectedKanji = stripRuby(targetWord.verb);

    const normalized = finalizeIME(userInput.trim());
    const isCorrect = matchesByRubyUnits(normalized, targetWord.verb);

    if (isCorrect) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    setDiffDisplay(targetWord.verb);

    const questionText = askTransitive
      ? t('transitive.transitiveOf', { verb: stripRuby(questionWord.verb) })
      : t('transitive.intransitiveOf', { verb: stripRuby(questionWord.verb) });

    setPrevAnswers(prev => [
      {
        question: questionText,
        userAnswer: normalized,
        correctAnswer: expectedKanji,
        isCorrect,
      },
      ...prev,
    ]);

    recordProgress(String(currentIdx), isCorrect);
    setAwaitingNext(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished) return;
    if (awaitingNext) {
      handleAwaitingNextKey(e, {
        canUndo: inputState === 'incorrect',
        onUndo: undoWrongAnswer,
        onAdvance: advanceToNext,
      });
      return;
    }

    if (e.key === 'Enter') {
      const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean };
      if (nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      if (userInput.trim()) {
        checkAnswer();
      }
    }
  };

  if (!currentPair) return null;

  const questionWord = askTransitive ? currentPair.i : currentPair.t;
  const pct = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100;

  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
              <div className="exercise-question">
                <JapaneseText text={questionWord.verb} showFurigana={showFurigana} />
              </div>
              <div className="form-hint">
                {askTransitive ? t('transitive.hintTransitive') : t('transitive.hintIntransitive')}
              </div>

              <div className="exercise-meta-row is-centered">
                <div className="exercise-meta-item is-english">
                  {askTransitive ? `${currentPair.i[lang]} ➔ ${currentPair.t[lang]}` : `${currentPair.t[lang]} ➔ ${currentPair.i[lang]}`}
                </div>
              </div>

              <input
                ref={inputRef}
                className={`exercise-input ${inputState}${undoFlash ? ' is-undone' : ''}`}
                value={userInput}
                onChange={e => {
                  if (awaitingNext) return;
                  const raw = e.target.value;
                  const composing = isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
                  if (composing) {
                    setUserInput(raw);
                    return;
                  }
                  const caret = e.target.selectionStart;
                  const converted = toHiraganaIME(raw);
                  if (caret !== null) {
                    pendingCaretRef.current = toHiraganaIME(raw.slice(0, caret)).length;
                  }
                  setUserInput(converted);
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                }}
                onKeyDown={handleKeyDown}
                placeholder=""
                {...exerciseAnswerInputProps}
              />

              {undoneBanner ? (
                <AnswerUndoneBanner />
              ) : (
                <div className={`answer-banner ${diffDisplay ? (inputState === 'correct' ? 'is-correct' : inputState === 'incorrect' ? 'is-incorrect' : '') : 'is-empty'}`}>
                  {diffDisplay ? (
                    <JapaneseText text={diffDisplay} showFurigana />
                  ) : (
                    '\u00A0'
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="options-panel">
          <div className="switches">
            <OptionToggle
              label={t('common.furigana')}
              checked={showFurigana}
              onChange={updateShowFurigana}
            />
          </div>
        </div>
      </div>

      <SessionProgressBar
        segments={progressSegments}
        pulses={progressPulses}
        correct={correct}
        incorrect={incorrect}
        pct={pct}
      />

      {prevAnswers.length > 0 && (
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
    </PageLayout>
  );
}
