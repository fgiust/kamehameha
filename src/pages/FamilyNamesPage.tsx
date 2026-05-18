import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import { familyNamesData } from '../data/familyNamesData';
import { KanaReadingEngine, ReadingItem } from '../engines/kanaReadingEngine';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { APP_TITLE_PREFIX, PreviousAnswer, updateFeedbackDetails } from '../types';
import JapaneseText from '../components/JapaneseText';

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

const PAGE_TITLE = 'Common family names';

export default function FamilyNamesPage() {
  const [currentItem, setCurrentItem] = useState<ReadingItem | null>(null);
  const [userInput, setUserInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [revealAnswer, setRevealAnswer] = useState<string>('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [seenKeys, setSeenKeys] = useState<Record<string, true>>({});
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  const totalItems = familyNamesData.length;

  const engine = useMemo(() => {
    const items = familyNamesData.map(item => ({
      question: item.kanji,
      answer: item.kana,
    }));
    return new KanaReadingEngine(items);
  }, []);

  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(totalItems, { persistKey: '/family-names' });

  const pickItem = useCallback(() => {
    const unseen = familyNamesData.filter(p => !seenKeys[p.kanji]);
    const pool = unseen.length > 0 ? unseen : familyNamesData;

    let selected = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && currentItem && selected.kanji === currentItem.question) {
      selected = pool[Math.floor(Math.random() * pool.length)];
    }

    const nextItem: ReadingItem = {
      question: selected.kanji,
      answer: selected.kana,
    };

    setCurrentItem(nextItem);
    setSeenKeys(prev => ({ ...prev, [selected.kanji]: true }));
    setUserInput('');
    setInputState('');
    setRevealAnswer('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentItem, seenKeys]);

  useEffect(() => {
    pickItem();
  }, []); // eslint-disable-line

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!currentItem) return;

    updateFeedbackDetails({
      section: PAGE_TITLE,
      question: currentItem.question,
      correctAnswer: currentItem.answer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentItem, userInput]);

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
    pickItem();
  }, [pickItem]);

  const checkAnswer = () => {
    if (!currentItem) return;

    const normalized = finalizeIME(userInput.trim());
    const isCorrect = engine.checkAnswer(currentItem, normalized);

    if (isCorrect) {
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
        isCorrect,
      },
      ...prev,
    ]);

    recordProgress(currentItem.question, isCorrect);
    setAwaitingNext(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      if (nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      if (userInput.trim()) {
        checkAnswer();
      }
    }
  };

  if (!currentItem) return null;

  const pct = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100;

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{PAGE_TITLE}</h1>
        <div className="page-actions">
          <Link to="/" className="header-btn" aria-label="Back">{'<'}</Link>
        </div>
      </div>

      <div className="card">
        <div className="exercise-container">
          <div className="exercise-question">
            <JapaneseText text={currentItem.question} showFurigana={false} />
          </div>
          
          <div className="form-hint">
            Write the reading in Hiragana
          </div>

          <input
            ref={inputRef}
            className={`exercise-input ${inputState}`}
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
            autoCorrect="off"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />

          <div className={`answer-banner ${revealAnswer ? (inputState === 'correct' ? 'is-correct' : 'is-incorrect') : 'is-empty'}`}>
            {revealAnswer ? (
              <span className="is-japanese" style={{ fontSize: '1.4rem' }}>{revealAnswer}</span>
            ) : (
              '\u00A0'
            )}
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
          <legend>Previous Answers</legend>
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
    </div>
  );
}
