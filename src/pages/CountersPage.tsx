import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { toHiragana } from 'wanakana';
import counters, { JapaneseCounter } from '../data/dictCounters';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from '../components/OptionToggle';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, CONJUGATION_SESSION_TARGET_TOTAL } from '../types';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import ExerciseCompletedMessage from '../components/ExerciseCompletedMessage';

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
  const v = counter.readings[String(num)];
  if (!v) return [''];
  return Array.isArray(v) ? v : [v];
}

type CounterQuestion = {
  id: string;
  counter: JapaneseCounter;
  num: number;
};

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
  const lastSlotRef = useRef<number | null>(null);
  const progressSegmentsRef = useRef<(0 | 1 | 2)[]>([]);
  const awaitingNextRef = useRef(false);

  const allQuestions = useMemo(() => {
    const list = peopleOnly ? (peopleCounter ? [peopleCounter] : []) : counters;
    const out: CounterQuestion[] = [];
    for (const c of list) {
      for (const k of Object.keys(c.readings)) {
        const n = Number(k);
        if (!Number.isFinite(n)) continue;
        const num = Math.floor(n);
        const id = `${c.en[1]}:${num}`;
        out.push({ id, counter: c, num });
      }
    }
    return out;
  }, [peopleOnly, peopleCounter]);
  const totalQuestions = CONJUGATION_SESSION_TARGET_TOTAL;
  const persistKey = peopleOnly ? '/counters-people' : '/counters';
  const { segments: progressSegments, pulses: progressPulses, recordAt: recordProgressAt } = useSessionProgress(totalQuestions, { persistKey });

  useEffect(() => {
    progressSegmentsRef.current = progressSegments;
  }, [progressSegments]);

  useEffect(() => {
    awaitingNextRef.current = awaitingNext;
  }, [awaitingNext]);

  const activeCounters = useMemo(() => {
    if (peopleOnly && peopleCounter) return [peopleCounter];
    const list = counters.filter(c => enabled[c.en[1]]);
    return list.length > 0 ? list : counters;
  }, [enabled, peopleOnly, peopleCounter]);

  const activeQuestions = useMemo(() => {
    const enabledSet = new Set(activeCounters.map(c => c.en[1]));
    return allQuestions.filter(q => enabledSet.has(q.counter.en[1]));
  }, [activeCounters, allQuestions]);

  const [sessionSlots, setSessionSlots] = useState<Array<CounterQuestion | null>>(
    () => Array(CONJUGATION_SESSION_TARGET_TOTAL).fill(null)
  );
  const sessionSlotsRef = useRef<Array<CounterQuestion | null>>(sessionSlots);

  useEffect(() => {
    sessionSlotsRef.current = sessionSlots;
  }, [sessionSlots]);

  const getRandomCandidate = useCallback((excludeIds: Set<string>) => {
    if (activeQuestions.length === 0) return null;
    const available = activeQuestions.filter(q => !excludeIds.has(q.id));
    const pool = available.length > 0 ? available : activeQuestions;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }, [activeQuestions]);

  const ensureSlotQuestion = useCallback((slot: number) => {
    if (slot < 0 || slot >= totalQuestions) return null;
    const currentSlots = sessionSlotsRef.current;
    const current = currentSlots[slot];
    if (current && activeCounters.some(c => c.en[1] === current.counter.en[1])) return current;

    const used = new Set<string>();
    for (const q of currentSlots) {
      if (!q) continue;
      if (q && q !== current) used.add(q.id);
    }
    const next = getRandomCandidate(used);
    if (!next) return null;

    setSessionSlots(prev => {
      const out = prev.slice();
      out[slot] = next;
      sessionSlotsRef.current = out;
      return out;
    });
    return next;
  }, [activeCounters, getRandomCandidate, totalQuestions]);

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
    if (awaitingNextRef.current) return;
    if (activeQuestions.length === 0) return;

    const segments = progressSegmentsRef.current;
    const unansweredFirst = segments.findIndex(s => s === 0);
    const incorrectFirst = segments.findIndex(s => s === 2);

    const phase: 0 | 2 | null = unansweredFirst !== -1 ? 0 : (incorrectFirst !== -1 ? 2 : null);
    if (phase === null) {
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

    let slot = phase === 0 ? unansweredFirst : incorrectFirst;
    if (slot < 0) slot = 0;
    lastSlotRef.current = slot;
    setCurrentQuestionIdx(slot);

    const nextQ = ensureSlotQuestion(slot);
    if (!nextQ) return;
    const chosen = nextQ.counter;
    const num = nextQ.num;

    const meaning = num === 1 ? chosen[lang][0] : chosen[lang][1];
    const shownNumber = num;
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
  }, [activeQuestions.length, ensureSlotQuestion, lang]);

  useEffect(() => {
    setIsFinished(false);
  }, [peopleOnly]);
  useEffect(() => {
    pickNext();
  }, [pickNext, peopleOnly]);

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
    const counterSurface = currentCounter ? stripBracketReading(currentCounter.counter) : '';
    const numberKanji = numberToKanji(answerKanji);
    setAnswerDisplay(
      <span className="is-japanese">
        {acceptedKana.length > 0 ? acceptedKana.map((kana, idx) => (
          <span key={idx}>
            {bracketToRubyNode(`${numberKanji}${counterSurface}[${kana}]`)}
            {idx < acceptedKana.length - 1 ? '、' : ''}
          </span>
        )) : (
          bracketToRubyNode(`${numberKanji}${counterSurface}[${kanaDisplay}]`)
        )}
      </span>
    );
    recordProgressAt(currentQuestionIdx, ok);
    setAwaitingNext(true);
  };

  const advance = () => {
    setAwaitingNext(false);
    awaitingNextRef.current = false;
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

  const pct = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100;

  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
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
            </>
          )}
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
                      setEnabled(prev => {
                        const isOn = !!prev[id];
                        const activeCount = Object.values(prev).filter(Boolean).length;
                        if (isOn && activeCount <= 1) return prev;
                        return { ...prev, [id]: !isOn };
                      });
                    }}
                  />
                );
              })}
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
    </PageLayout>
  );
}
