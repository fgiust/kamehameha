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
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [currentItem, setCurrentItem] = useState<ReadingItem | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [revealAnswer, setRevealAnswer] = useState<string>('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const remainingIdxRef = useRef<number[]>([]);
  const lastIdxRef = useRef<number | null>(null);
  const phaseRef = useRef<0 | 2 | null>(null);

  const totalItems = familyNamesData.length;

  const engine = useMemo(() => {
    const items = familyNamesData.map(item => ({
      question: item.kanji,
      answer: item.kana,
    }));
    return new KanaReadingEngine(items);
  }, []);

  const { segments: progressSegments, pulses: progressPulses, recordAt: recordProgressAt } = useSessionProgress(totalItems, { persistKey: '/family-names' });
  const progressSegmentsRef = useRef(progressSegments);

  useEffect(() => {
    progressSegmentsRef.current = progressSegments;
  }, [progressSegments]);

  const pickItem = useCallback(() => {
    if (familyNamesData.length === 0) return;

    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < familyNamesData.length; i++) {
      const s = progressSegmentsRef.current[i] ?? 0;
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setInputState('');
      setRevealAnswer('');
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

    const selected = familyNamesData[nextIdx]!;

    const nextItem: ReadingItem = {
      question: selected.kanji,
      answer: selected.kana,
    };

    setCurrentItem(nextItem);
    setUserInput('');
    setInputState('');
    setRevealAnswer('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    setIsFinished(false);
    pickItem();
  }, []); // eslint-disable-line

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!currentItem || isFinished) return;

    updateFeedbackDetails({
      section: PAGE_TITLE,
      question: currentItem.question,
      correctAnswer: currentItem.answer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentItem, userInput, isFinished]);

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
    if (isFinished) return;
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

    recordProgressAt(currentIdx, isCorrect);
    setAwaitingNext(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished) return;
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
