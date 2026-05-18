import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import { getJapaneseNumberReadings } from '../engines/japaneseNumber';
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

function pickOne(items: string[]) {
  if (items.length === 0) return '';
  return items[Math.floor(Math.random() * items.length)];
}

const PAGE_TITLE = 'Numbers Practice';

export default function NumbersPage() {
  const [digits, setDigits] = useState(5);
  const [reverse, setReverse] = useState(false);

  const [currentNumber, setCurrentNumber] = useState('');
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState<string[] | string>('');

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answerDisplay, setAnswerDisplay] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const lastNumberRef = useRef<string>('');
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(100, { persistKey: '/numbers' });

  const pickNext = useCallback(() => {
    let number = '';
    do {
      number = Math.floor(Math.random() * Math.pow(10, digits)).toString();
    } while (number === lastNumberRef.current);
    lastNumberRef.current = number;
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
    pickNext();
  }, [pickNext]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!question) return;

    const acceptedList = Array.isArray(accepted) ? accepted : [accepted];

    updateFeedbackDetails({
      section: `${PAGE_TITLE} (${digits} Digits, Mode: ${reverse ? 'Hiragana -> Number' : 'Number -> Hiragana'})`,
      question,
      correctAnswer: acceptedList.join(' / '),
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, accepted, digits, reverse, userInput]);

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
      setAnswerDisplay(list.length > 1 ? list.join(' or ') : list[0] ?? '');
    }

    recordProgress(currentNumber || question, ok);
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
          <div className={`exercise-question ${reverse ? 'is-japanese' : ''}`} style={{ fontFamily: reverse ? 'Noto Sans JP, sans-serif' : 'Open Sans, sans-serif' }}>
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
              label="Hiragana⇄Number"
              checked={reverse}
              onChange={val => setReverse(val)}
            />

            <div className="switch-item">
              <span className="switch-text">Digits: {digits}</span>
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
    </div>
  );
}
