import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import counters, { JapaneseCounter } from '../data/dictCounters';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from '../components/OptionToggle';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX } from '../types';
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

function stripBracketReading(text: string) {
  const m = /^(.*)\[(.*)\]$/.exec(text);
  if (!m) return text;
  return m[1] ?? text;
}

function numberToKanji(n: number) {
  const digits: Record<number, string> = {
    0: '〇',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
  };

  const x = Math.max(0, Math.floor(n));
  if (x < 10) return digits[x] ?? String(x);
  if (x === 10) return '十';
  if (x < 20) return `十${digits[x % 10] ?? ''}`;
  const tens = Math.floor(x / 10);
  const ones = x % 10;
  const tenPart = tens === 1 ? '十' : `${digits[tens] ?? String(tens)}十`;
  return ones === 0 ? tenPart : `${tenPart}${digits[ones] ?? String(ones)}`;
}

function uniqueStrings(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const v = s.trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function joinAcceptedForDisplay(items: string[]) {
  return items.length > 1 ? items.join('、') : (items[0] ?? '');
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

type Props = {
  peopleOnly?: boolean;
};

export default function CountersPage({ peopleOnly: peopleOnlyProp }: Props) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const peopleOnly = useMemo(() => {
    if (typeof peopleOnlyProp === 'boolean') return peopleOnlyProp;
    const params = new URLSearchParams(location.search);
    return params.get('people') === 'true';
  }, [location.search, peopleOnlyProp]);
  const pageTitle = peopleOnly ? t('pages.countersPeople.title') : t('pages.counters.title');

  const peopleCounter = useMemo(() => counters.find(c => c.en[1] === 'people') ?? null, []);
  const prevPeopleOnlyRef = useRef<boolean>(peopleOnly);

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const next: Record<string, boolean> = {};
    if (peopleOnly) {
      for (const c of counters) next[c.en[1]] = c.en[1] === 'people';
    } else {
      for (const c of counters) next[c.en[1]] = true;
    }
    return next;
  });

  const [currentCounter, setCurrentCounter] = useState<JapaneseCounter | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [question, setQuestion] = useState('');
  const [acceptedKana, setAcceptedKana] = useState<string[]>([]);
  const [acceptedAll, setAcceptedAll] = useState<string[]>([]);
  const [kanjiAnswer, setKanjiAnswer] = useState('');
  const [answerKanji, setAnswerKanji] = useState<number>(0);

  const [userInput, setUserInput] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [answerDisplay, setAnswerDisplay] = useState<ReactNode | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const remainingIdxRef = useRef<number[]>([]);
  const lastIdxRef = useRef<number | null>(null);
  const phaseRef = useRef<0 | 2 | null>(null);

  const allQuestions = useMemo(() => {
    const list = peopleOnly ? (peopleCounter ? [peopleCounter] : []) : counters;
    const out: Array<{ counter: JapaneseCounter; num: number }> = [];
    for (const c of list) {
      for (let i = 0; i < c.readings.length; i++) out.push({ counter: c, num: i });
      for (const k of Object.keys(c.extraReadings ?? {})) {
        const n = Number(k);
        if (Number.isFinite(n)) out.push({ counter: c, num: Math.floor(n) });
      }
    }
    return out;
  }, [peopleOnly, peopleCounter]);
  const totalQuestions = allQuestions.length;
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress, getState: getProgressState } = useSessionProgress(totalQuestions, { persistKey: peopleOnly ? '/counters-people' : '/counters' });

  const activeCounters = useMemo(() => {
    if (peopleOnly && peopleCounter) return [peopleCounter];
    const list = counters.filter(c => enabled[c.en[1]]);
    return list.length > 0 ? list : counters;
  }, [enabled, peopleOnly, peopleCounter]);

  useEffect(() => {
    const wasPeopleOnly = prevPeopleOnlyRef.current;
    prevPeopleOnlyRef.current = peopleOnly;

    if (peopleOnly) {
      setEnabled(() => {
        const next: Record<string, boolean> = {};
        for (const c of counters) next[c.en[1]] = c.en[1] === 'people';
        return next;
      });
      return;
    }

    if (wasPeopleOnly) {
      setEnabled(() => {
        const next: Record<string, boolean> = {};
        for (const c of counters) next[c.en[1]] = true;
        return next;
      });
    }
  }, [peopleOnly]);

  const pickNext = useCallback(() => {
    if (activeCounters.length === 0) return;

    const activeCounterSet = new Set(activeCounters.map(c => c.counter));
    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < allQuestions.length; i++) {
      const q = allQuestions[i]!;
      if (!activeCounterSet.has(q.counter.counter)) continue;
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setCurrentCounter(null);
      setQuestion('');
      setAcceptedKana([]);
      setAcceptedAll([]);
      setKanjiAnswer('');
      setAnswerKanji(0);
      setUserInput('');
      setAwaitingNext(false);
      setInputState('');
      setAnswerDisplay(null);
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
    setCurrentQuestionIdx(nextIdx);

    const nextQ = allQuestions[nextIdx]!;
    const chosen = nextQ.counter;
    const num = nextQ.num;

    const meaning = num === 0 ? chosen[lang][0] : chosen[lang][1];
    const shownNumber = num < 10 ? num + 1 : num;
    const qText = `${shownNumber} ${meaning}`;

    const answersKana = getAnswers(chosen, num).filter(Boolean);
    const nextNumberKanji = numberToKanji(shownNumber);
    const counterSurface = stripBracketReading(chosen.counter);
    const nextKanjiAnswer = `${nextNumberKanji}${counterSurface}`;
    const allAccepted = uniqueStrings([...answersKana, nextKanjiAnswer]);
    setCurrentCounter(chosen);
    setQuestion(qText);
    setAcceptedKana(uniqueStrings(answersKana));
    setKanjiAnswer(nextKanjiAnswer);
    setAnswerKanji(shownNumber);
    setAcceptedAll(allAccepted);

    setUserInput('');
    setAwaitingNext(false);
    setInputState('');
    setAnswerDisplay(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeCounters, allQuestions, getProgressState]);

  useEffect(() => {
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    setIsFinished(false);
  }, [peopleOnly]);
  useEffect(() => {
    pickNext();
  }, [pickNext]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + pageTitle;
  }, [i18n.language, pageTitle]);

  // Update feedback details globally
  useEffect(() => {
    if (!question) return;

    updateFeedbackDetails({
      section: pageTitle,
      question: t('counters.feedbackQuestion', { question, meaning: currentCounter ? currentCounter[lang][0] : '' }),
      correctAnswer: joinAcceptedForDisplay(uniqueStrings([...acceptedKana, kanjiAnswer])),
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, acceptedKana, kanjiAnswer, currentCounter, userInput, pageTitle, t, lang]);

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
    if (!currentCounter) return;
    const normalized = finalizeIME(userInput.trim());
    if (!normalized) return;

    const ok = acceptedAll.includes(normalized);
    if (ok) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    const kanaDisplay = joinAcceptedForDisplay(acceptedKana);
    const counterNode = currentCounter ? bracketToRubyNode(currentCounter.counter) : null;
    const numberKanji = numberToKanji(answerKanji);
    setAnswerDisplay(
      <span>
        <span className="is-japanese">{numberKanji}{counterNode}</span>
        {kanaDisplay ? <span style={{ fontSize: '0.8em', fontWeight: 600 }}> — {kanaDisplay}</span> : null}
      </span>
    );
    recordProgress(String(currentQuestionIdx), ok);
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
    for (const c of counters) next[c.en[1]] = anyOff;
    setEnabled(next);
  };

  const pct = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100;

  return (
    <div className="app-container">
      <div className="page-actions">
        <BackButton fallbackTo="/" />
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
            {answerDisplay ?? '\u00A0'}
          </div>
        </div>

        {!peopleOnly && (
          <div className="options-panel">
            <div className="switches">
              {counters.map(c => {
                const id = c.en[1];
                return (
                  <OptionToggle
                    key={id}
                    label={<>{c[lang][1]}</>}
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
                {Object.values(enabled).every(v => v) ? t('counters.selectNone') : t('counters.selectAll')}
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
