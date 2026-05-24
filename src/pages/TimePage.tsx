import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';
import { toHiragana } from 'wanakana';
import { getJapaneseTimeReadings } from '../engines/japaneseTime';
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

type SlotTime = { hour: number; minute: number; amPm: 0 | 1 | 2 };

const PERSIST_KEY = '/time';

export default function TimePage() {
  const { t, i18n } = useTranslation();
  const pageTitle = t('pages.time.title');
  const [reverse, setReverse] = useState(false);
  const fingerprint = useMemo(
    () => buildExerciseFingerprint(PERSIST_KEY, reverse ? 1 : 0, DEFAULT_MASTERY_RANDOM_TOTAL),
    [reverse],
  );
  const restoredDraft = useExerciseSessionDraft(PERSIST_KEY, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);
  const settingsReadyRef = useRef(false);
  const settingsChangedRef = useRef(false);
  const restoredExtras = restoredDraft?.extras;
  const restoredSlotTimes = Array.isArray(restoredExtras?.slotTimes)
    && restoredExtras.slotTimes.length === DEFAULT_MASTERY_RANDOM_TOTAL
    ? restoredExtras.slotTimes as Array<SlotTime | null>
    : null;

  const [currentSlot, setCurrentSlot] = useState<number>(restoredDraft?.currentIdx ?? 0);
  const [currentTime, setCurrentTime] = useState(
    () => (typeof restoredExtras?.currentTime === 'string' ? restoredExtras.currentTime : ''),
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
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [answerDisplay, setAnswerDisplay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const lastMinuteRef = useRef<number>(
    typeof restoredExtras?.lastMinute === 'number' ? restoredExtras.lastMinute : -1,
  );
  const slotTimeRef = useRef<Array<SlotTime | null>>(
    restoredSlotTimes ? [...restoredSlotTimes] : Array(DEFAULT_MASTERY_RANDOM_TOTAL).fill(null),
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
        reverse,
        slotTimes: [...slotTimeRef.current],
        lastMinute: lastMinuteRef.current,
        currentTime,
        question,
        accepted,
      },
    }),
    [accepted, correct, currentTime, currentSlot, incorrect, isFinished, progressSegments, question, reverse, getProgressSnapshot],
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
      setCurrentTime('');
      setQuestion('');
      setAccepted([]);
      return;
    }

    setIsFinished(false);
    setCurrentSlot(slot);

    const state = progressSegmentsRef.current[slot] ?? 0;
    const stored = state === 2 ? slotTimeRef.current[slot] : null;
    let nextHour = stored?.hour ?? 0;
    let nextMinute = stored?.minute ?? 0;
    const nextAmPm = stored?.amPm ?? 0;

    if (!stored) {
      do {
        nextMinute = Math.floor(Math.random() * 60);
      } while (nextMinute === lastMinuteRef.current);
      lastMinuteRef.current = nextMinute;
      nextHour = Math.floor(Math.random() * 24);
      slotTimeRef.current[slot] = { hour: nextHour, minute: nextMinute, amPm: nextAmPm };
    }

    let minStr = nextMinute.toString();
    if (minStr.length === 1) minStr = '0' + minStr;
    const timeStr = `${nextHour}:${minStr}`;

    const answers = getJapaneseTimeReadings(nextHour, nextMinute, nextAmPm).filter(Boolean);

    setCurrentTime(timeStr);
    if (reverse) {
      setQuestion(pickOne(answers));
      setAccepted(timeStr);
    } else {
      setQuestion(timeStr);
      setAccepted(answers);
    }

    setUserInput('');
    setAwaitingNext(false);
    setInputState('');
    setAnswerDisplay('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [reverse]);

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
  }, [reverse, pickNext]);

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
      section: pageTitle,
      question,
      correctAnswer: acceptedList.join(' / '),
      userAnswer: reverse ? userInput.trim() : finalizeIME(userInput.trim()),
    });
  }, [question, accepted, userInput, isFinished, reverse]);

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
      setAnswerDisplay(currentTime);
    } else {
      const list = Array.isArray(accepted) ? accepted : [accepted];
      setAnswerDisplay(list.join(` ${t('common.or')} `));
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
              <div className="exercise-question" style={{ fontFamily: 'Open Sans, sans-serif' }}>
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
