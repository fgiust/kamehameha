import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import daysOfMonth from '../data/daysOfMonth';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
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

const PAGE_TITLE = 'Days of the Month';

export default function DaysPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answerDisplay, setAnswerDisplay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const lastDayRef = useRef<number>(-1);
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(31, { persistKey: '/days' });

  const pickNext = useCallback(() => {
    const max = 31;
    let next = 0;
    do {
      next = Math.floor(Math.random() * max);
    } while (max > 1 && next === lastDayRef.current);
    lastDayRef.current = next;

    setQuestion(`${next + 1}日`);
    setAnswer(daysOfMonth[next]);

    setUserInput('');
    setAwaitingNext(false);
    setInputState('');
    setAnswerDisplay('');
    setTimeout(() => inputRef.current?.focus(), 50);
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
      section: PAGE_TITLE,
      question,
      correctAnswer: answer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, answer, userInput]);

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
    const normalized = finalizeIME(userInput.trim());
    if (!normalized) return;

    const ok = normalized === answer;
    if (ok) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }
    setAnswerDisplay(answer);
    recordProgress(question || String(lastDayRef.current), ok);
    setAwaitingNext(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          <div className="exercise-question is-japanese">{question || '...'}</div>

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
