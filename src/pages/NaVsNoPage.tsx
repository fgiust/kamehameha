import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { naVsNoData } from '../data/naVsNoData';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { APP_TITLE_PREFIX, PreviousAnswer, SETTINGS_KEYS, updateFeedbackDetails } from '../types';
import JapaneseText from '../components/JapaneseText';
import OptionToggle from '../components/OptionToggle';

const PAGE_TITLE = 'な vs の Adjectives';

const totalQuestions = naVsNoData.questions['な'].length + naVsNoData.questions['の'].length;

export default function NaVsNoPage() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [status, setStatus] = useState<'correct' | 'incorrect' | ''>('');
  const [wait, setWait] = useState(false);
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

  const allQuestions = useMemo(() => {
    const out: Array<{ text: string; answer: 'な' | 'の' }> = [];
    for (const q of naVsNoData.questions['な']) out.push({ text: q, answer: 'な' });
    for (const q of naVsNoData.questions['の']) out.push({ text: q, answer: 'の' });
    return out;
  }, []);
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress, getState: getProgressState } = useSessionProgress(totalQuestions, { persistKey: '/na-vs-no' });
  const remainingIdxRef = useRef<number[]>([]);
  const lastIdxRef = useRef<number | null>(null);
  const phaseRef = useRef<0 | 2 | null>(null);

  const newQuestion = useCallback(() => {
    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < allQuestions.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setWait(false);
      setStatus('');
      setQuestion('');
      setAnswer('');
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
    const q = allQuestions[nextIdx]!;

    setQuestion(q.text);
    setAnswer(q.answer);
    setStatus('');
    setWait(false);
  }, [allQuestions, getProgressState]);

  useEffect(() => {
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    setIsFinished(false);
    newQuestion();
  }, [newQuestion]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + PAGE_TITLE;
  }, []);

  // Update feedback details globally
  useEffect(() => {
    if (!question || isFinished) return;
    updateFeedbackDetails({
      section: PAGE_TITLE,
      question,
      correctAnswer: answer,
      userAnswer: status ? (status === 'correct' ? answer : (answer === 'な' ? 'の' : 'な')) : '',
    });
  }, [question, answer, status, isFinished]);

  const handleClick = useCallback((choice: string) => {
    if (isFinished) return;
    if (wait) {
      newQuestion();
      return;
    }
    const isCorrect = choice === answer;
    if (isCorrect) {
      setCorrect(c => c + 1);
      setStatus('correct');
    } else {
      setIncorrect(c => c + 1);
      setStatus('incorrect');
    }
    setWait(true);

    recordProgress(String(currentIdx), isCorrect);

    setPrevAnswers(prev => [{
      question: question,
      userAnswer: choice,
      correctAnswer: answer,
      isCorrect,
    }, ...prev]);
  }, [wait, answer, question, newQuestion, recordProgress, currentIdx, isFinished]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !e.repeat) {
        toggleFurigana();
        return;
      }
      if (wait && e.key === 'Enter') {
        newQuestion();
      } else if (!wait) {
        if (e.key === 'ArrowLeft') handleClick('な');
        if (e.key === 'ArrowRight') handleClick('の');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wait, handleClick, newQuestion, toggleFurigana]);

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
            <JapaneseText text={question} showFurigana={showFurigana} />
          </div>
          
          <div className="form-hint">
            Choose whether the adjective is more likely to use な or の
          </div>

          <div className="choices-container">
            <button
              className={`choice-btn ${wait && answer === 'な' ? 'is-correct' : wait && status === 'incorrect' && answer !== 'な' ? 'is-incorrect' : ''}`}
              onClick={() => handleClick('な')}
              disabled={wait}
            >
              な
            </button>
            <button
              className={`choice-btn ${wait && answer === 'の' ? 'is-correct' : wait && status === 'incorrect' && answer !== 'の' ? 'is-incorrect' : ''}`}
              onClick={() => handleClick('の')}
              disabled={wait}
            >
              の
            </button>
          </div>

          <div className={`answer-banner ${wait ? (status === 'correct' ? 'is-correct' : 'is-incorrect') : 'is-empty'}`}>
            {wait ? (status === 'correct' ? 'Correct!' : `Last Answer: ${answer}`) : '\u00A0'}
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
              <span className="q">
                <JapaneseText text={a.question} showFurigana={showFurigana} />
              </span>
              <span className="user-ans">{a.userAnswer}</span>
              {!a.isCorrect && <span className="correct-ans">→ {a.correctAnswer}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
