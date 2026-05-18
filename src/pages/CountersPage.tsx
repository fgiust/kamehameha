import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import counters, { JapaneseCounter } from '../data/counters';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from '../components/OptionToggle';
import { APP_TITLE_PREFIX, updateFeedbackDetails } from '../types';

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

function bracketToRubyNode(text: string) {
  const m = /^(.*)\[(.*)\]$/.exec(text);
  if (!m) return <>{text}</>;
  return (
    <ruby>
      {m[1]}
      <rt>{m[2]}</rt>
    </ruby>
  );
}

function getAnswers(counter: JapaneseCounter, num: number) {
  if (num < 10) {
    const v = counter.readings[num];
    return Array.isArray(v) ? v : [v];
  }
  const v = counter.extraReadings?.[String(num)];
  if (!v) return [''];
  return Array.isArray(v) ? v : [v];
}

const PAGE_TITLE = 'Counters Practice';

type Props = {
  peopleOnly?: boolean;
};

export default function CountersPage({ peopleOnly: peopleOnlyProp }: Props) {
  const location = useLocation();
  const peopleOnly = useMemo(() => {
    if (typeof peopleOnlyProp === 'boolean') return peopleOnlyProp;
    const params = new URLSearchParams(location.search);
    return params.get('people') === 'true';
  }, [location.search, peopleOnlyProp]);

  const peopleCounter = useMemo(() => counters.find(c => c.meaning[1] === 'people') ?? null, []);
  const prevPeopleOnlyRef = useRef<boolean>(peopleOnly);

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const next: Record<string, boolean> = {};
    if (peopleOnly) {
      for (const c of counters) next[c.meaning[1]] = c.meaning[1] === 'people';
    } else {
      for (const c of counters) next[c.meaning[1]] = true;
    }
    return next;
  });

  const [currentCounter, setCurrentCounter] = useState<JapaneseCounter | null>(null);
  const [currentNumber, setCurrentNumber] = useState<number>(0);
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState<string[]>([]);

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answerDisplay, setAnswerDisplay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const lastCounterRef = useRef<string>('');
  const lastNumberRef = useRef<number>(-1);
  const poolByCounterRef = useRef<Record<string, number[]>>({});

  const totalQuestions = useMemo(() => {
    if (peopleOnly && peopleCounter) return peopleCounter.readings.length + Object.keys(peopleCounter.extraReadings ?? {}).length;
    return counters.reduce((acc, c) => acc + c.readings.length + Object.keys(c.extraReadings ?? {}).length, 0);
  }, [peopleOnly, peopleCounter]);
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(totalQuestions, { persistKey: peopleOnly ? '/counters-people' : '/counters' });

  const activeCounters = useMemo(() => {
    if (peopleOnly && peopleCounter) return [peopleCounter];
    const list = counters.filter(c => enabled[c.meaning[1]]);
    return list.length > 0 ? list : counters;
  }, [enabled, peopleOnly, peopleCounter]);

  useEffect(() => {
    const wasPeopleOnly = prevPeopleOnlyRef.current;
    prevPeopleOnlyRef.current = peopleOnly;

    if (peopleOnly) {
      setEnabled(() => {
        const next: Record<string, boolean> = {};
        for (const c of counters) next[c.meaning[1]] = c.meaning[1] === 'people';
        return next;
      });
      return;
    }

    if (wasPeopleOnly) {
      setEnabled(() => {
        const next: Record<string, boolean> = {};
        for (const c of counters) next[c.meaning[1]] = true;
        return next;
      });
    }
  }, [peopleOnly]);

  const resetPoolIfNeeded = (counterKey: string) => {
    const arr = poolByCounterRef.current[counterKey];
    if (!arr || arr.length <= 2) {
      const base = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      if (counterKey === '歳[さい]') base.push(20);
      poolByCounterRef.current[counterKey] = base;
    }
  };

  const pickNext = useCallback(() => {
    if (activeCounters.length === 0) return;

    let chosen: JapaneseCounter;
    let num: number;
    do {
      chosen = activeCounters[Math.floor(Math.random() * activeCounters.length)];
      resetPoolIfNeeded(chosen.counter);
      const pool = poolByCounterRef.current[chosen.counter];
      num = pool[Math.floor(Math.random() * pool.length)];
    } while ((lastCounterRef.current === chosen.counter && activeCounters.length > 1) || lastNumberRef.current === num);

    lastCounterRef.current = chosen.counter;
    lastNumberRef.current = num;

    const meaning = num === 0 ? chosen.meaning[0] : chosen.meaning[1];
    const shownNumber = num < 10 ? num + 1 : num;
    const q = `${shownNumber} ${meaning}`;

    const answers = getAnswers(chosen, num).filter(Boolean);
    setCurrentCounter(chosen);
    setCurrentNumber(num);
    setQuestion(q);
    setAccepted(answers);

    setUserInput('');
    setAwaitingNext(false);
    setInputState('');
    setAnswerDisplay('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeCounters]);

  useEffect(() => {
    for (const c of counters) resetPoolIfNeeded(c.counter);
  }, []);  
  useEffect(() => {
    pickNext();
  }, [pickNext]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!question) return;

    updateFeedbackDetails({
      section: peopleOnly ? 'Counters (People)' : PAGE_TITLE,
      question: `${question} (meaning: ${currentCounter ? currentCounter.meaning[0] : ''})`,
      correctAnswer: accepted.join(' / '),
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, accepted, currentCounter, peopleOnly, userInput]);

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
    if (!currentCounter) return;
    const normalized = finalizeIME(userInput.trim());
    if (!normalized) return;

    const ok = accepted.includes(normalized);
    const progressKey = `${currentCounter.counter}:${currentNumber}`;
    if (ok) {
      setCorrect(c => c + 1);
      setInputState('correct');
      const key = currentCounter.counter;
      const pool = poolByCounterRef.current[key] ?? [];
      const idx = pool.indexOf(currentNumber);
      if (idx !== -1) pool.splice(idx, 1);
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    setAnswerDisplay(accepted.length > 1 ? accepted.join(' or ') : accepted[0] ?? '');
    recordProgress(progressKey, ok);
    setAwaitingNext(true);
  };

  const advance = () => {
    pickNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (awaitingNext) {
      if (e.key === 'Enter') {
        e.preventDefault();
        advance();
        return;
      }
      if (!e.altKey && !e.ctrlKey && !e.metaKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        advance();
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

  const toggleAll = () => {
    const anyOff = Object.values(enabled).some(v => !v);
    const next: Record<string, boolean> = {};
    for (const c of counters) next[c.meaning[1]] = anyOff;
    setEnabled(next);
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

        {!peopleOnly && (
          <div className="options-panel">
            <div className="switches">
              {counters.map(c => {
                const id = c.meaning[1];
                return (
                  <OptionToggle
                    key={id}
                    label={<>～{bracketToRubyNode(c.counter)} ({c.meaning[1]})</>}
                    checked={!!enabled[id]}
                    onChange={() => {
                      setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={toggleAll}
                style={{
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text)',
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
              >
                {Object.values(enabled).every(v => v) ? 'Select None' : 'Select All'}
              </button>
            </div>
          </div>
        )}
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
