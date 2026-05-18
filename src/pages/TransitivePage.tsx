import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stripRuby } from '../engines/sentenceEngine';
import { toHiragana } from 'wanakana';
import { transitiveData, VerbPair } from '../data/transitiveData';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { APP_TITLE_PREFIX, PreviousAnswer, SETTINGS_KEYS, updateFeedbackDetails } from '../types';
import JapaneseText from '../components/JapaneseText';
import OptionToggle from '../components/OptionToggle';

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

const PAGE_TITLE = 'Transitive / Intransitive pairs';

export default function TransitivePage() {
  const [currentPair, setCurrentPair] = useState<VerbPair | null>(null);
  const [askTransitive, setAskTransitive] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [diffDisplay, setDiffDisplay] = useState<string>('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [seenKeys, setSeenKeys] = useState<Record<string, true>>({});
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>([]);
  const [showFurigana, setShowFurigana] = useState(() => {
    try {
      return localStorage.getItem(SETTINGS_KEYS.showFurigana) !== 'false';
    } catch {
      return true;
    }
  });

  const toggleFurigana = useCallback(() => {
    setShowFurigana(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SETTINGS_KEYS.showFurigana, String(next));
      } catch {
        // noop
      }
      return next;
    });
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  const totalPairs = transitiveData.length;
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(totalPairs, { persistKey: '/transitive' });

  const pickPair = useCallback(() => {
    const unseen = transitiveData.filter(p => !seenKeys[p.t.verb]);
    const pool = unseen.length > 0 ? unseen : transitiveData;

    let pair = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && currentPair && pair.t.verb === currentPair.t.verb) {
      pair = pool[Math.floor(Math.random() * pool.length)];
    }

    setCurrentPair(pair);
    setSeenKeys(prev => ({ ...prev, [pair.t.verb]: true }));
    setAskTransitive(Math.random() < 0.5);
    setUserInput('');
    setInputState('');
    setDiffDisplay('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentPair, seenKeys]);

  useEffect(() => {
    pickPair();
  }, []); // eslint-disable-line

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!currentPair) return;
    const questionWord = askTransitive ? currentPair.i : currentPair.t;
    const targetWord = askTransitive ? currentPair.t : currentPair.i;

    const expectedTargetKanji = stripRuby(targetWord.verb);
    const expectedTargetHiragana = targetWord.verb.replace(/\[.*?\]/g, (match) => match.slice(1, -1));

    updateFeedbackDetails({
      section: PAGE_TITLE,
      question: `${stripRuby(questionWord.verb)} (${questionWord.meaning}) - Mode: Ask ${askTransitive ? 'Transitive' : 'Intransitive'}`,
      correctAnswer: `${expectedTargetHiragana} (${expectedTargetKanji}) - ${targetWord.meaning}`,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentPair, askTransitive, userInput]);

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

  const checkAnswer = () => {
    if (!currentPair) return;
    const questionWord = askTransitive ? currentPair.i : currentPair.t;
    const targetWord = askTransitive ? currentPair.t : currentPair.i;

    const expectedKanji = stripRuby(targetWord.verb);
    const expectedHiragana = targetWord.verb.replace(/\[.*?\]/g, (match) => {
      // Extract the reading inside brackets
      return match.slice(1, -1);
    });

    const normalized = finalizeIME(userInput.trim());
    const isCorrect = normalized === expectedHiragana || normalized === expectedKanji;

    if (isCorrect) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    setDiffDisplay(targetWord.verb);

    const promptText = askTransitive ? 'Transitive of: ' : 'Intransitive of: ';
    const questionText = promptText + stripRuby(questionWord.verb);

    setPrevAnswers(prev => [
      {
        question: questionText,
        userAnswer: normalized,
        correctAnswer: expectedKanji,
        isCorrect,
      },
      ...prev,
    ]);

    const progressKey = `${currentPair.t.verb}|${askTransitive ? 't' : 'i'}`;
    recordProgress(progressKey, isCorrect);
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

  if (!currentPair) return null;

  const questionWord = askTransitive ? currentPair.i : currentPair.t;
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
            <JapaneseText text={questionWord.verb} showFurigana={showFurigana} />
          </div>
          <div className="form-hint">
            {askTransitive ? 'Transitive Form' : 'Intransitive Form'}
          </div>

          <div className="exercise-meta-row is-centered">
            <div className="exercise-meta-item is-english">
              {askTransitive ? `${currentPair.i.meaning} ➔ ${currentPair.t.meaning}` : `${currentPair.t.meaning} ➔ ${currentPair.i.meaning}`}
            </div>
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

          <div className={`answer-banner ${diffDisplay ? (inputState === 'correct' ? 'is-correct' : inputState === 'incorrect' ? 'is-incorrect' : '') : 'is-empty'}`}>
            {diffDisplay ? (
              <JapaneseText text={diffDisplay} showFurigana={showFurigana} />
            ) : (
              '\u00A0'
            )}
          </div>
        </div>

        <div className="options-panel">
          <div className="switches">
            <OptionToggle
              label="Furigana ⇧"
              checked={showFurigana}
              onChange={toggleFurigana}
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
