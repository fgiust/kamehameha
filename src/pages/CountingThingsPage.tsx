import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';
import { toHiragana } from 'wanakana';
import SessionProgressBar from '../components/SessionProgressBar';
import KeyboardTip from '../components/KeyboardTip';
import { useSessionProgress } from '../hooks/useSessionProgress';
import { updateFeedbackDetails } from '../utils/feedback';
import { PreviousAnswer } from '../types';
import { useExercisePageMeta } from '../seo/useExercisePageMeta';
import { diffSentenceAnswer, generateAnswers, matchesByRubyUnits, parseAnswerTemplate, pickBestDiff, stripRuby } from 'tenshindiff';
import DiffDisplay from '../components/DiffDisplay';
import { useTranslation } from 'react-i18next';
import countingThings, { type CountingThingCounter } from '../data/dictCountingThings';
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
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(input)) return input;
  if (input.endsWith('n')) return input.slice(0, -1) + 'ん';
  return input;
}

const ITEMS = countingThings;

const KANJI_NUM: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
  10: '十',
};

function pickOne<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toAltSurface(surface: string, readings: string[]) {
  const uniq = Array.from(new Set(readings.filter(Boolean)));
  if (uniq.length <= 1) return `${surface}[${uniq[0] ?? ''}]`;
  return `{${uniq.map(r => `${surface}[${r}]`).join('|')}}`;
}

function counterSurfaceAndReadings(kind: CountingThingCounter, n: number): { surface: string; readings: string[] } {
  if (n < 1 || n > 10) return { surface: '', readings: [] };
  const num = KANJI_NUM[n] ?? '';

  if (kind === 'hiki') {
    const surface = `${num}匹`;
    const readings: Record<number, string[]> = {
      1: ['いっぴき'],
      2: ['にひき'],
      3: ['さんびき'],
      4: ['よんひき'],
      5: ['ごひき'],
      6: ['ろっぴき'],
      7: ['ななひき', 'しちひき'],
      8: ['はちひき', 'はっぴき'],
      9: ['きゅうひき'],
      10: ['じゅっぴき', 'じっぴき'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'tou') {
    const surface = `${num}頭`;
    const readings: Record<number, string[]> = {
      1: ['いっとう'],
      2: ['にとう'],
      3: ['さんとう'],
      4: ['よんとう'],
      5: ['ごとう'],
      6: ['ろくとう'],
      7: ['ななとう', 'しちとう'],
      8: ['はちとう', 'はっとう'],
      9: ['きゅうとう'],
      10: ['じゅっとう', 'じっとう'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'mune') {
    const surface = `${num}棟`;
    const readings: Record<number, string[]> = {
      1: ['いっとう'],
      2: ['にとう'],
      3: ['さんとう'],
      4: ['よんとう'],
      5: ['ごとう'],
      6: ['ろくとう'],
      7: ['ななとう', 'しちとう'],
      8: ['はちとう', 'はっとう'],
      9: ['きゅうとう'],
      10: ['じゅっとう', 'じっとう'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'satsu') {
    const surface = `${num}冊`;
    const readings: Record<number, string[]> = {
      1: ['いっさつ'],
      2: ['にさつ'],
      3: ['さんさつ'],
      4: ['よんさつ'],
      5: ['ごさつ'],
      6: ['ろくさつ'],
      7: ['ななさつ', 'しちさつ'],
      8: ['はちさつ', 'はっさつ'],
      9: ['きゅうさつ'],
      10: ['じゅっさつ', 'じっさつ'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'mai') {
    const surface = `${num}枚`;
    return { surface, readings: [`${n === 1 ? 'いち' : n === 2 ? 'に' : n === 3 ? 'さん' : n === 4 ? 'よん' : n === 5 ? 'ご' : n === 6 ? 'ろく' : n === 7 ? 'なな' : n === 8 ? 'はち' : n === 9 ? 'きゅう' : 'じゅう'}まい`] };
  }

  if (kind === 'dai') {
    const surface = `${num}台`;
    return { surface, readings: [`${n === 1 ? 'いち' : n === 2 ? 'に' : n === 3 ? 'さん' : n === 4 ? 'よん' : n === 5 ? 'ご' : n === 6 ? 'ろく' : n === 7 ? 'なな' : n === 8 ? 'はち' : n === 9 ? 'きゅう' : 'じゅう'}だい`] };
  }

  if (kind === 'nin') {
    const surface = `${num}人`;
    const readings: Record<number, string[]> = {
      1: ['ひとり'],
      2: ['ふたり'],
      3: ['さんにん'],
      4: ['よにん'],
      5: ['ごにん'],
      6: ['ろくにん'],
      7: ['ななにん', 'しちにん'],
      8: ['はちにん'],
      9: ['きゅうにん', 'くにん'],
      10: ['じゅうにん'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'hai') {
    const surface = `${num}杯`;
    const readings: Record<number, string[]> = {
      1: ['いっぱい'],
      2: ['にはい'],
      3: ['さんばい'],
      4: ['よんはい'],
      5: ['ごはい'],
      6: ['ろっぱい'],
      7: ['ななはい'],
      8: ['はっぱい'],
      9: ['きゅうはい'],
      10: ['じゅっぱい', 'じっぱい'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'hon') {
    const surface = `${num}本`;
    const readings: Record<number, string[]> = {
      1: ['いっぽん'],
      2: ['にほん'],
      3: ['さんぼん'],
      4: ['よんほん'],
      5: ['ごほん'],
      6: ['ろっぽん'],
      7: ['ななほん', 'しちほん'],
      8: ['はちほん', 'はっぽん'],
      9: ['きゅうほん'],
      10: ['じゅっぽん', 'じっぽん'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'kai') {
    const surface = `${num}回`;
    const readings: Record<number, string[]> = {
      1: ['いっかい'],
      2: ['にかい'],
      3: ['さんかい'],
      4: ['よんかい'],
      5: ['ごかい'],
      6: ['ろっかい'],
      7: ['ななかい', 'しちかい'],
      8: ['はちかい', 'はっかい'],
      9: ['きゅうかい'],
      10: ['じゅっかい', 'じっかい'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'floor') {
    const surface = `${num}階`;
    const readings: Record<number, string[]> = {
      1: ['いっかい'],
      2: ['にかい'],
      3: ['さんかい'],
      4: ['よんかい'],
      5: ['ごかい'],
      6: ['ろっかい'],
      7: ['ななかい', 'しちかい'],
      8: ['はちかい', 'はっかい'],
      9: ['きゅうかい'],
      10: ['じゅっかい', 'じっかい'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'day') {
    const surface: Record<number, string> = {
      1: '一日',
      2: '二日',
      3: '三日',
      4: '四日',
      5: '五日',
      6: '六日',
      7: '七日',
      8: '八日',
      9: '九日',
      10: '十日',
    };
    const readings: Record<number, string[]> = {
      1: ['いちにち'],
      2: ['ふつか'],
      3: ['みっか'],
      4: ['よっか'],
      5: ['いつか'],
      6: ['むいか'],
      7: ['なのか'],
      8: ['ようか'],
      9: ['ここのか'],
      10: ['とおか'],
    };
    return { surface: surface[n] ?? '', readings: readings[n] ?? [] };
  }

  if (kind === 'month') {
    const surface = `${num}ヶ月`;
    const readings: Record<number, string[]> = {
      1: ['いっかげつ'],
      2: ['にかげつ'],
      3: ['さんかげつ'],
      4: ['よんかげつ'],
      5: ['ごかげつ'],
      6: ['ろっかげつ'],
      7: ['ななかげつ'],
      8: ['はっかげつ'],
      9: ['きゅうかげつ'],
      10: ['じゅっかげつ', 'じっかげつ'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'week') {
    const surface = `${num}週間`;
    const readings: Record<number, string[]> = {
      1: ['いっしゅうかん'],
      2: ['にしゅうかん'],
      3: ['さんしゅうかん'],
      4: ['よんしゅうかん'],
      5: ['ごしゅうかん'],
      6: ['ろくしゅうかん'],
      7: ['ななしゅうかん'],
      8: ['はっしゅうかん'],
      9: ['きゅうしゅうかん'],
      10: ['じゅっしゅうかん', 'じっしゅうかん'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'hour') {
    const surface = `${num}時間`;
    const readings: Record<number, string[]> = {
      1: ['いちじかん'],
      2: ['にじかん'],
      3: ['さんじかん'],
      4: ['よじかん'],
      5: ['ごじかん'],
      6: ['ろくじかん'],
      7: ['しちじかん'],
      8: ['はちじかん'],
      9: ['くじかん'],
      10: ['じゅうじかん'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'minute') {
    const surface = `${num}分`;
    const readings: Record<number, string[]> = {
      1: ['いっぷん'],
      2: ['にふん'],
      3: ['さんぷん'],
      4: ['よんぷん'],
      5: ['ごふん'],
      6: ['ろっぷん'],
      7: ['ななふん'],
      8: ['はっぷん'],
      9: ['きゅうふん'],
      10: ['じゅっぷん', 'じっぷん'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'second') {
    const surface = `${num}秒`;
    const readings: Record<number, string[]> = {
      1: ['いちびょう'],
      2: ['にびょう'],
      3: ['さんびょう'],
      4: ['よんびょう'],
      5: ['ごびょう'],
      6: ['ろくびょう'],
      7: ['ななびょう'],
      8: ['はちびょう'],
      9: ['きゅうびょう'],
      10: ['じゅうびょう'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  if (kind === 'ko') {
    const surface = `${num}個`;
    const readings: Record<number, string[]> = {
      1: ['いっこ'],
      2: ['にこ'],
      3: ['さんこ'],
      4: ['よんこ'],
      5: ['ごこ'],
      6: ['ろっこ'],
      7: ['ななこ', 'しちこ'],
      8: ['はちこ', 'はっこ'],
      9: ['きゅうこ'],
      10: ['じゅっこ', 'じっこ'],
    };
    return { surface, readings: readings[n] ?? [] };
  }

  return { surface: '', readings: [] };
}

function localizedLabel(n: number, labels: [string, string]) {
  return `${n} ${n === 1 ? labels[0] : labels[1]}`;
}

const PERSIST_KEY = '/counting-things';

export default function CountingThingsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const pageTitle = t('pages.countingThings.title');
  const fingerprint = useMemo(
    () => buildExerciseFingerprint(PERSIST_KEY, ITEMS.length),
    [],
  );
  const restoredDraft = useExerciseSessionDraft(PERSIST_KEY, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);
  const restoredExtras = restoredDraft?.extras;
  const [currentIdx, setCurrentIdx] = useState(restoredDraft?.currentIdx ?? 0);
  const [question, setQuestion] = useState(
    () => (typeof restoredExtras?.question === 'string' ? restoredExtras.question : ''),
  );
  const [accepted, setAccepted] = useState<string[]>(() =>
    (Array.isArray(restoredExtras?.accepted) ? restoredExtras.accepted as string[] : []),
  );

  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);
  const [answerFeedback, setAnswerFeedback] = useState<null | {
    isCorrect: boolean;
    userAnswer: string;
    displayAnswer: string;
    ops: ReturnType<typeof diffSentenceAnswer>;
  }>(null);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>(restoredDraft?.prevAnswers ?? []);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const remainingIdxRef = useRef<number[]>(restoredDraft?.picker.remainingIdx ?? []);
  const lastIdxRef = useRef<number | null>(restoredDraft?.picker.lastIdx ?? null);
  const phaseRef = useRef<0 | 2 | null>(restoredDraft?.picker.phase ?? null);
  const lastNumberRef = useRef<number | null>(
    typeof restoredExtras?.lastNumber === 'number' ? restoredExtras.lastNumber : null,
  );

  const {
    segments: progressSegments,
    pulses: progressPulses,
    record: recordProgress,
    getState: getProgressState,
    getProgressSnapshot,
  } = useSessionProgress(ITEMS.length, {
    persistKey: PERSIST_KEY,
    initialProgress: restoredDraft?.progress,
  });

  usePersistExerciseDraft(
    PERSIST_KEY,
    fingerprint,
    () => ({
      progress: getProgressSnapshot(),
      picker: {
        remainingIdx: [...remainingIdxRef.current],
        phase: phaseRef.current,
        lastIdx: lastIdxRef.current,
      },
      currentIdx,
      correct,
      incorrect,
      prevAnswers,
      isFinished,
      extras: {
        question,
        accepted,
        lastNumber: lastNumberRef.current,
      },
    }),
    [accepted, correct, currentIdx, incorrect, isFinished, prevAnswers, progressSegments, question, getProgressSnapshot],
  );

  const buildQuestion = useCallback((idx: number, n: number) => {
    const item = ITEMS[idx]!;
    return localizedLabel(n, item[lang]);
  }, [lang]);

  const buildAccepted = useCallback((idx: number, n: number) => {
    const item = ITEMS[idx]!;
    const { surface, readings } = counterSurfaceAndReadings(item.counter, n);
    if (!surface || readings.length === 0) return [];
    const counterTemplate = toAltSurface(surface, readings);
    const template = `${item.nounRuby}${counterTemplate}`;
    return generateAnswers(parseAnswerTemplate(template));
  }, []);

  const pickNext = useCallback(() => {
    if (ITEMS.length === 0) return;

    const unanswered: number[] = [];
    const incorrectIdx: number[] = [];
    for (let i = 0; i < ITEMS.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrectIdx.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrectIdx.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setAnswerFeedback(null);
      setInputState('');
      setQuestion('');
      setAccepted([]);
      setUserInput('');
      setRawInput('');
      setDidConvert(false);
      setIsComposing(false);
      return;
    }

    setIsFinished(false);

    if (phaseRef.current !== nextPhase || remainingIdxRef.current.length === 0) {
      remainingIdxRef.current = (nextPhase === 0 ? unanswered : incorrectIdx).slice();
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

    let n = pickOne([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    if (lastNumberRef.current !== null && n === lastNumberRef.current) {
      n = ((n % 10) + 1) as number;
    }
    lastNumberRef.current = n;

    const nextAccepted = buildAccepted(nextIdx, n);
    if (nextAccepted.length === 0) {
      remainingIdxRef.current.push(nextIdx);
      return;
    }

    setCurrentIdx(nextIdx);
    setQuestion(buildQuestion(nextIdx, n));
    setAccepted(nextAccepted);
    setUserInput('');
    setRawInput('');
    setDidConvert(false);
    setIsComposing(false);
    setInputState('');
    setAnswerFeedback(null);
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [buildAccepted, buildQuestion, getProgressState]);

  useEffect(() => {
    if (didInitPickRef.current) return;
    didInitPickRef.current = true;

    if (shouldRestoreSessionRef.current) {
      if (!isFinished) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return;
    }
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    lastNumberRef.current = null;
    setIsFinished(false);
    pickNext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFinished) clearExerciseSessionDraft(PERSIST_KEY);
  }, [isFinished]);

  const pageMeta = useExercisePageMeta({ internalPath: '/counting-things' });

  useEffect(() => {
    if (!question || isFinished) return;
    updateFeedbackDetails({
      section: pageTitle,
      question,
      correctAnswer: accepted.length > 0 ? stripRuby(accepted[0]!) : '',
      rawCorrectAnswer: accepted.length > 0 ? accepted[0]! : '',
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [question, accepted, userInput, isFinished, pageTitle]);

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
    pickNext();
  }, [pickNext]);

  const checkAnswer = useCallback(() => {
    if (awaitingNext) return;
    if (isFinished) return;
    if (!question || accepted.length === 0) return;
    if (!userInput.trim()) return;
    const normalized = finalizeIME(userInput.trim());
    const isCorrect = accepted.some(a => matchesByRubyUnits(normalized, a));
    const { bestAnswer: displayAnswer, ops } = pickBestDiff(normalized, accepted);

    if (isCorrect) {
      setCorrect(c => c + 1);
      setInputState('correct');
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
    }

    setAnswerFeedback({
      isCorrect,
      userAnswer: normalized,
      displayAnswer,
      ops,
    });

    setPrevAnswers(prev => [{
      question,
      userAnswer: normalized,
      correctAnswer: stripRuby(displayAnswer),
      isCorrect,
      displayAnswer,
      diffOps: ops,
    }, ...prev]);

    recordProgress(String(currentIdx), isCorrect);
    setAwaitingNext(true);
  }, [accepted, awaitingNext, currentIdx, isFinished, question, recordProgress, userInput]);

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
      if (isComposingRef.current || nativeEvent.isComposing) return;
      e.preventDefault();
      checkAnswer();
    }
  };

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  return (
    <PageLayout pageTitle={pageTitle} intro={pageMeta.intro}>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
              <div className="exercise-question" style={{ fontSize: 20, fontFamily: 'Open Sans, sans-serif' }}>
                {question || t('common.loading')}
              </div>

              <div className="exercise-input-block">
                <input
                  ref={inputRef}
                  className={`exercise-input ${inputState}`}
                  value={userInput}
                  onChange={e => {
                    if (awaitingNext) return;
                    const raw = e.target.value;
                    setRawInput(raw);
                    const caret = e.target.selectionStart;
                    const composing = isComposingRef.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing;
                    if (composing) {
                      setDidConvert(false);
                      setIsComposing(true);
                      setUserInput(raw);
                      return;
                    }
                    setIsComposing(false);

                    const didConvertNow = /[A-Za-z]/.test(raw);
                    setDidConvert(didConvertNow);
                    const converted = toHiraganaIME(raw);
                    if (caret !== null) {
                      pendingCaretRef.current = toHiraganaIME(raw.slice(0, caret)).length;
                    }
                    setUserInput(converted);
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                    setIsComposing(true);
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                    setIsComposing(false);
                  }}
                  onKeyDown={handleKeyDown}
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <KeyboardTip preferred="japanese" rawValue={rawInput} isComposing={isComposing} didConvert={didConvert} />
              </div>

              <div className={`answer-banner ${answerFeedback ? (answerFeedback.isCorrect ? 'is-correct' : 'is-incorrect') : 'is-empty'}`}>
                {answerFeedback ? (
                  <DiffDisplay ops={answerFeedback.ops} className="diff-answer" />
                ) : (
                  '\u00A0'
                )}
              </div>
            </>
          )}
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
          {prevAnswers.slice(0, 20).map((a, i) => (
            <div key={i} className={`prev-answer-item ${a.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
              <span className="icon">{a.isCorrect ? '✓' : '✗'}</span>
              <span className="q" style={{ fontSize: 13 }}>{a.question}</span>
              <span className="user-ans">{a.userAnswer}</span>
              {!a.isCorrect && <span className="correct-ans">→ {a.correctAnswer}</span>}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
