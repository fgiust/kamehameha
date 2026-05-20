import { useCallback, useEffect, useRef, useState } from 'react';
import { toHiragana } from 'wanakana';
import { getJapaneseTimeReadings } from '../engines/japaneseTime';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from '../components/OptionToggle';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, DEFAULT_MASTERY_RANDOM_TOTAL } from '../types';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

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

export default function TimePage() {
  const { t, i18n } = useTranslation();
  const pageTitle = t('pages.time.title');
  const [reverse, setReverse] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState('');
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState<string[] | string>('');
  const [isFinished, setIsFinished] = useState(false);

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answerDisplay, setAnswerDisplay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const lastMinuteRef = useRef<number>(-1);
  const slotTimeRef = useRef<Array<{ hour: number; minute: number; amPm: 0 | 1 | 2 } | null>>(Array(DEFAULT_MASTERY_RANDOM_TOTAL).fill(null));
  const { segments: progressSegments, pulses: progressPulses, recordAt: recordProgressAt } = useSessionProgress(DEFAULT_MASTERY_RANDOM_TOTAL, { persistKey: '/time' });
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
    setIsFinished(false);
    pickNext();
  }, [pickNext]);

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
    <div className="app-container">
      <div className="page-actions">
        <BackButton />
      </div>

      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
      </div>

      <div className="card">
        <div className="exercise-container">
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
    </div>
  );
}
