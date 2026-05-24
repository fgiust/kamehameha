import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';
import { toHiragana } from 'wanakana';
import { getJapaneseNumberReadings } from '../engines/japaneseNumber';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from '../components/OptionToggle';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, DEFAULT_MASTERY_RANDOM_TOTAL } from '../types';
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

function pickOne(items: string[]) {
  if (items.length === 0) return '';
  return items[Math.floor(Math.random() * items.length)];
}

const PERSIST_KEY = '/numbers';

export default function NumbersPage() {
  const { t, i18n } = useTranslation();
  const pageTitle = t('pages.numbers.title');
  const [digits, setDigits] = useState(5);
  const [reverse, setReverse] = useState(false);
  const fingerprint = useMemo(
    () => buildExerciseFingerprint(PERSIST_KEY, digits, reverse ? 1 : 0, DEFAULT_MASTERY_RANDOM_TOTAL),
    [digits, reverse],
  );
  const restoredDraft = useExerciseSessionDraft(PERSIST_KEY, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);
  const settingsReadyRef = useRef(false);
  const settingsChangedRef = useRef(false);
  const restoredExtras = restoredDraft?.extras;
  const restoredSlotNumbers = Array.isArray(restoredExtras?.slotNumbers)
    && restoredExtras.slotNumbers.length === DEFAULT_MASTERY_RANDOM_TOTAL
    ? restoredExtras.slotNumbers as Array<string | null>
    : null;

  const [currentSlot, setCurrentSlot] = useState<number>(restoredDraft?.currentIdx ?? 0);
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);
  const [currentNumber, setCurrentNumber] = useState(
    () => (typeof restoredExtras?.currentNumber === 'string' ? restoredExtras.currentNumber : ''),
  );
  const [question, setQuestion] = useState(
    () => (typeof restoredExtras?.question === 'string' ? restoredExtras.question : ''),
  );
  const [accepted, setAccepted] = useState<string[] | string>(() => {
    const saved = restoredExtras?.accepted;
    if (typeof saved === 'string') return saved;
    if (Array.isArray(saved)) return saved as string[];
    return '';
  });

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [answerDisplay, setAnswerDisplay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const lastNumberRef = useRef<string>(
    typeof restoredExtras?.lastNumber === 'string' ? restoredExtras.lastNumber : '',
  );
  const slotNumberRef = useRef<Array<string | null>>(
    restoredSlotNumbers ? [...restoredSlotNumbers] : Array(DEFAULT_MASTERY_RANDOM_TOTAL).fill(null),
  );
  const {
    segments: progressSegments,
    pulses: progressPulses,
    recordAt: recordProgressAt,
    getProgressSnapshot,
  } = useSessionProgress(DEFAULT_MASTERY_RANDOM_TOTAL, {
    persistKey: PERSIST_KEY,
    initialProgress: restoredDraft?.progress,
  });

  usePersistExerciseDraft(
    PERSIST_KEY,
    fingerprint,
    () => ({
      progress: getProgressSnapshot(),
      picker: { remainingIdx: [], phase: null, lastIdx: null },
      currentIdx: currentSlot,
      correct,
      incorrect,
      prevAnswers: [],
      isFinished,
      extras: {
        digits,
        reverse,
        slotNumbers: [...slotNumberRef.current],
        lastNumber: lastNumberRef.current,
        currentNumber,
        question,
        accepted,
      },
    }),
    [accepted, correct, currentNumber, currentSlot, digits, incorrect, isFinished, progressSegments, question, reverse, getProgressSnapshot],
  );
  const progressSegmentsRef = useRef(progressSegments);

  useEffect(() => {
    progressSegmentsRef.current = progressSegments;
  }, [progressSegments]);

  const pickNext = useCallback(() => {
    const totalSlots = DEFAULT_MASTERY_RANDOM_TOTAL;
    let slot = -1;
    for (let i = 0; i < totalSlots; i++) {
      const s = progressSegmentsRef.current[i] ?? 0;
      if (s === 0) { slot = i; break; }
    }
    if (slot === -1) {
      for (let i = 0; i < totalSlots; i++) {
        const s = progressSegmentsRef.current[i] ?? 0;
        if (s === 2) { slot = i; break; }
      }
    }

    if (slot === -1) {
      setIsFinished(true);
      setAwaitingNext(false);
      setInputState('');
      setAnswerDisplay('');
      setUserInput('');
      setCurrentNumber('');
      setQuestion('');
      setAccepted('');
      return;
    }

    setIsFinished(false);
    setCurrentSlot(slot);

    let number = slotNumberRef.current[slot];
    if (!number || (progressSegmentsRef.current[slot] ?? 0) === 0) {
      let next = '';
      do {
        next = Math.floor(Math.random() * Math.pow(10, digits)).toString();
      } while (next === lastNumberRef.current);
      number = next;
      slotNumberRef.current[slot] = number;
      lastNumberRef.current = number;
    }
    setCurrentNumber(number);

    const readings = getJapaneseNumberReadings(number, true, true).filter(Boolean);
    if (reverse) {
      const q = pickOne(readings);
      setQuestion(q);
      setAccepted(number);
    } else {
      setQuestion(number);
      setAccepted(readings);
    }

    setUserInput('');
    setAwaitingNext(false);
    setInputState('');
    setAnswerDisplay('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [digits, reverse]);

  useEffect(() => {
    if (didInitPickRef.current) return;
    didInitPickRef.current = true;

    if (shouldRestoreSessionRef.current) {
      if (!isFinished) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      settingsReadyRef.current = true;
      return;
    }
    setIsFinished(false);
    pickNext();
    settingsReadyRef.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!settingsReadyRef.current) return;
    if (!settingsChangedRef.current) {
      settingsChangedRef.current = true;
      return;
    }
    shouldRestoreSessionRef.current = false;
    setIsFinished(false);
    pickNext();
  }, [digits, reverse, pickNext]);

  useEffect(() => {
    if (isFinished) clearExerciseSessionDraft(PERSIST_KEY);
  }, [isFinished]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + pageTitle;
  }, [i18n.language]);

  // Update feedback details globally
  useEffect(() => {
    if (!question || isFinished) return;

    const acceptedList = Array.isArray(accepted) ? accepted : [accepted];

    updateFeedbackDetails({
      section: t('numbers.feedbackSection', {
        title: pageTitle,
        digits,
        mode: reverse ? t('numbers.modeHiraToNum') : t('numbers.modeNumToHira'),
      }),
      question,
      correctAnswer: acceptedList.join(' / '),
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, accepted, digits, reverse, userInput, isFinished]);

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

  const submit = () => {
    if (awaitingNext) return;
    if (isFinished) return;
    const normalized = reverse ? userInput.trim() : finalizeIME(userInput.trim());
    if (!normalized) return;

    const ok = Array.isArray(accepted) ? accepted.includes(normalized) : accepted === normalized;
    if (ok) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    if (reverse) {
      setAnswerDisplay(currentNumber);
    } else {
      const list = Array.isArray(accepted) ? accepted : [accepted];
      setAnswerDisplay(list.length > 1 ? list.join(` ${t('common.or')} `) : list[0] ?? '');
    }

    recordProgressAt(currentSlot, ok);
    setAwaitingNext(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      submit();
    }
  };

  const pct = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100;

  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
              <div className={`exercise-question ${reverse ? 'is-japanese' : ''}`} style={{ fontFamily: reverse ? 'Noto Sans JP, sans-serif' : 'Open Sans, sans-serif' }}>
                {question || t('common.loading')}
              </div>

              <input
                ref={inputRef}
                className={`exercise-input ${inputState}`}
                value={userInput}
                onChange={e => {
                  if (awaitingNext) return;
                  const raw = e.target.value;
                  const caret = e.target.selectionStart;
                  const converted = reverse ? raw : toHiraganaIME(raw);
                  if (caret !== null) {
                    pendingCaretRef.current = reverse ? caret : toHiraganaIME(raw.slice(0, caret)).length;
                  }
                  setUserInput(converted);
                }}
                onKeyDown={handleKeyDown}
                autoCorrect="off"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
              />

              <div className={`answer-banner ${answerDisplay ? (inputState === 'correct' ? 'is-correct' : inputState === 'incorrect' ? 'is-incorrect' : '') : 'is-empty'}`}>
                {answerDisplay || '\u00A0'}
              </div>
            </>
          )}
        </div>

        <div className="options-panel">
          <div className="switches">
            <OptionToggle
              label={t('numbers.reverseLabel')}
              checked={reverse}
              onChange={val => setReverse(val)}
            />

            <div className="switch-item">
              <span className="switch-text">{t('numbers.digits', { count: digits })}</span>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={digits}
                onChange={e => setDigits(parseInt(e.target.value, 10))}
                style={{ width: 160 }}
              />
            </div>
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
    </PageLayout>
  );
}
