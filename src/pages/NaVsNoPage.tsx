import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { naVsNoData } from '../data/naVsNoData';
import { MultipleChoiceEngine } from '../engines/multipleChoice';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { APP_TITLE_PREFIX, PreviousAnswer, SETTINGS_KEYS, updateFeedbackDetails } from '../types';
import JapaneseText from '../components/JapaneseText';
import OptionToggle from '../components/OptionToggle';

const PAGE_TITLE = 'な vs の Adjectives';

const totalQuestions = naVsNoData.questions['な'].length + naVsNoData.questions['の'].length;

export default function NaVsNoPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
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

  const engine = useMemo(() => new MultipleChoiceEngine(naVsNoData), []);
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(totalQuestions, { persistKey: '/na-vs-no' });

  const newQuestion = useCallback(() => {
    const q = engine.generateQuestion();
    setQuestion(q.text);
    setAnswer(q.correctAnswer);
    setStatus('');
    setWait(false);
  }, [engine]);

  useEffect(() => {
    newQuestion();
  }, [newQuestion]);

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
      userAnswer: status ? (status === 'correct' ? answer : (answer === 'な' ? 'の' : 'な')) : '',
    });
  }, [question, answer, status]);

  const handleClick = useCallback((choice: string) => {
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

    const progressKey = `${question}|${answer}`;
    recordProgress(progressKey, isCorrect);

    setPrevAnswers(prev => [{
      question: question,
      userAnswer: choice,
      correctAnswer: answer,
      isCorrect,
    }, ...prev]);
  }, [wait, answer, question, newQuestion, recordProgress]);

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
