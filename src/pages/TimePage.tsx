import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import { getJapaneseTimeReadings } from '../engines/japaneseTime';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { APP_TITLE_PREFIX, DEFAULT_MASTERY_RANDOM_TOTAL, updateFeedbackDetails } from '../types';

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

const PAGE_TITLE = 'Time Practice';

export default function TimePage() {
  const [currentSlot, setCurrentSlot] = useState<number>(0);
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState<string[]>([]);
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
  const remainingSlotRef = useRef<number[]>([]);
  const lastSlotRef = useRef<number | null>(null);
  const phaseRef = useRef<0 | 2 | null>(null);
  const { segments: progressSegments, pulses: progressPulses, recordAt: recordProgressAt } = useSessionProgress(DEFAULT_MASTERY_RANDOM_TOTAL, { persistKey: '/time' });
  const progressSegmentsRef = useRef(progressSegments);

  useEffect(() => {
    progressSegmentsRef.current = progressSegments;
  }, [progressSegments]);

  const pickNext = useCallback(() => {
    const totalSlots = DEFAULT_MASTERY_RANDOM_TOTAL;
    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < totalSlots; i++) {
      const s = progressSegmentsRef.current[i] ?? 0;
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setInputState('');
      setAnswerDisplay('');
      setUserInput('');
      setQuestion('');
      setAccepted([]);
      return;
    }

    setIsFinished(false);

    if (phaseRef.current !== nextPhase || remainingSlotRef.current.length === 0) {
      remainingSlotRef.current = (nextPhase === 0 ? unanswered : incorrect).slice();
      phaseRef.current = nextPhase;
    }

    const pool = remainingSlotRef.current;
    let pickIndex = Math.floor(Math.random() * pool.length);
    const last = lastSlotRef.current;
    if (last !== null && pool.length > 1 && pool[pickIndex] === last) {
      pickIndex = (pickIndex + 1) % pool.length;
    }
    const slot = pool.splice(pickIndex, 1)[0]!;
    lastSlotRef.current = slot;
    setCurrentSlot(slot);

    let nextMinute = 0;
    do {
      nextMinute = Math.floor(Math.random() * 60);
    } while (nextMinute === lastMinuteRef.current);
    lastMinuteRef.current = nextMinute;

    const nextHour = Math.floor(Math.random() * 24);
    const nextAmPm = 0;

    let minStr = nextMinute.toString();
    if (minStr.length === 1) minStr = '0' + minStr;
    const q = `${nextHour}:${minStr}`;

    const answers = getJapaneseTimeReadings(nextHour, nextMinute, nextAmPm);

    setQuestion(q);
    setAccepted(answers);

    setUserInput('');
    setAwaitingNext(false);
    setInputState('');
    setAnswerDisplay('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    remainingSlotRef.current = [];
    phaseRef.current = null;
    lastSlotRef.current = null;
    setIsFinished(false);
    pickNext();
  }, [pickNext]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!question || isFinished) return;

    updateFeedbackDetails({
      section: PAGE_TITLE,
      question,
      correctAnswer: accepted.join(' / '),
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, accepted, userInput, isFinished]);

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
    const normalized = finalizeIME(userInput.trim());
    if (!normalized) return;

    const ok = accepted.includes(normalized);
    if (ok) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }
    setAnswerDisplay(accepted.join(' or '));
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
        <Link to="/" className="header-btn" aria-label="Back">&lt;</Link>
      </div>

      <div className="page-header">
        <h1 className="page-heading">{PAGE_TITLE}</h1>
      </div>

      <div className="card">
        <div className="exercise-container">
          <div className="exercise-question" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {question || '...'}
          </div>

          <input
            ref={inputRef}
            className={`exercise-input ${inputState}`}
            value={userInput}
            onChange={e => {
              if (awaitingNext) return;
              const raw = e.target.value;
              const caret = e.target.selectionStart;
              const converted = toHiraganaIME(raw);
              if (caret !== null) {
                pendingCaretRef.current = toHiraganaIME(raw.slice(0, caret)).length;
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
