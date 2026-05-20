import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, SentenceItem, PreviousAnswer } from '../types';
import { DiffUnitOp, diffSentenceAnswer, generateAnswers, parseAnswerTemplate, matchesByRubyUnits, stripRuby, pickBestDiff } from '../engines/sentenceEngine';
import { toHiragana } from 'wanakana';
import SessionProgressBar from './SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import KeyboardTip from './KeyboardTip';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  sentenceData: SentenceItem[];
  backPath: string;
  persistKey?: string;
}

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

function hasJapaneseChars(text: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

function hasLatinLetters(text: string) {
  return /[A-Za-z]/.test(text);
}

function isLatinImeChar(ch: string) {
  return /[A-Za-z'-]/.test(ch);
}

export default function SentenceExercise({ title, sentenceData, backPath, persistKey }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [isFinished, setIsFinished] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<null | {
    isCorrect: boolean;
    userAnswer: string;
    displayAnswer: string;
    ops: ReturnType<typeof diffSentenceAnswer>;
  }>(null);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const lastRawValueRef = useRef('');
  const remainingIdxRef = useRef<number[]>([]);
  const lastIdxRef = useRef<number | null>(null);
  const phaseRef = useRef<0 | 2 | null>(null);
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress, getState: getProgressState } = useSessionProgress(sentenceData.length, { persistKey });

  const currentItem = sentenceData[currentIdx];
  const promptText = (() => {
    if (!currentItem) return '';
    if (lang === 'it' && currentItem.italian) return currentItem.italian;
    return currentItem.english || '';
  })();

  const pickNext = useCallback(() => {
    if (sentenceData.length === 0) return;

    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < sentenceData.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setAnswerFeedback(null);
      setInputState('');
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
    setUserInput('');
    setRawInput('');
    setDidConvert(false);
    lastRawValueRef.current = '';
    setInputState('');
    setAnswerFeedback(null);
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [sentenceData.length, getProgressState]);

  useEffect(() => {
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    setIsFinished(false);
    pickNext();
  }, [pickNext, sentenceData.length]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + title;
  }, [title]);

  // Update feedback details globally
  useEffect(() => {
    if (!currentItem || isFinished) return;

    updateFeedbackDetails({
      section: title,
      question: promptText,
      correctAnswer: currentItem.answer,
      rawCorrectAnswer: currentItem.answer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentItem, title, userInput, isFinished, promptText]);

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
    if (!currentItem || !userInput.trim()) return;
    const normalized = finalizeIME(userInput.trim());
    const rawAnswers = generateAnswers(parseAnswerTemplate(currentItem.answer));
    const isCorrect = rawAnswers.some(a => matchesByRubyUnits(normalized, a));
    const { bestAnswer: displayAnswer, ops } = pickBestDiff(normalized, rawAnswers);

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
      question: promptText,
      userAnswer: normalized,
      correctAnswer: stripRuby(displayAnswer),
      isCorrect,
      displayAnswer,
      diffOps: ops,
    }, ...prev]);

    recordProgress(String(currentIdx), isCorrect);
    setAwaitingNext(true);
  }, [awaitingNext, currentItem, userInput, promptText, recordProgress, currentIdx, isFinished]);

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
      if (isComposingRef.current || nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      checkAnswer();
    }
  };

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  const renderDiff = useCallback((ops: DiffUnitOp[]) => {
    const nodes: React.ReactNode[] = [];
    for (const op of ops) {
      if (op.kind === 'extra') {
        nodes.push(<span key={`ext-${nodes.length}`} className="diff-char diff-deleted">{op.text}</span>);
        continue;
      }

      // op.kind === 'unit'
      const { unit, status } = op;

      if (unit.kind === 'plain') {
        nodes.push(
          <span key={`p-${nodes.length}`} className={`diff-char ${status === 'missing' ? 'diff-missing' : 'diff-correct'}`}>
            {unit.surface}
          </span>
        );
        continue;
      }

      // Ruby unit
      const kanjiClass =
        status === 'correct_kanji' ? 'diff-correct'
          : status === 'correct_kana' ? 'diff-kanji-kana'
            : 'diff-missing';
      const rtClass = status === 'missing' ? 'diff-missing' : 'diff-correct';

      nodes.push(
        <ruby key={`r-${nodes.length}`} className={kanjiClass}>
          {unit.surface}
          <rt className={rtClass}>{unit.reading}</rt>
        </ruby>
      );
    }

    return nodes;
  }, []);

  const diffNode = (() => {
    if (!answerFeedback) return null;
    return <div className="diff-display diff-answer">{renderDiff(answerFeedback.ops)}</div>;
  })();

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{title}</h1>
        <div className="page-actions">
          <Link to={backPath} className="header-btn" aria-label={t('common.back')}>{'<'}</Link>
        </div>
      </div>

      <div className="card">
        <div className="exercise-container">
          {!isFinished && (
            <>
              <div className="exercise-prompt">{t('sentenceExercise.promptTranslate')}</div>
              <div className="exercise-question" style={{ fontSize: 20, fontFamily: 'Open Sans, sans-serif' }}>
                {promptText}
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
                      lastRawValueRef.current = raw;
                      return;
                    }

                    setIsComposing(false);

                    const prev = lastRawValueRef.current;
                    let prefixLen = 0;
                    const minLen = Math.min(prev.length, raw.length);
                    while (prefixLen < minLen && prev[prefixLen] === raw[prefixLen]) prefixLen++;

                    let suffixLen = 0;
                    while (
                      suffixLen < (prev.length - prefixLen) &&
                      suffixLen < (raw.length - prefixLen) &&
                      prev[prev.length - 1 - suffixLen] === raw[raw.length - 1 - suffixLen]
                    ) {
                      suffixLen++;
                    }

                    let convertStart = prefixLen;
                    while (convertStart > 0 && isLatinImeChar(raw[convertStart - 1] ?? '') && !hasJapaneseChars(raw[convertStart - 1] ?? '')) {
                      convertStart--;
                    }

                    const convertEnd = raw.length - suffixLen;
                    const segment = raw.slice(convertStart, convertEnd);

                    if (hasLatinLetters(segment) && !hasJapaneseChars(segment)) {
                      setDidConvert(true);
                      const convertedSegment = toHiraganaIME(segment);
                      const nextValue = raw.slice(0, convertStart) + convertedSegment + raw.slice(convertEnd);
                      if (caret !== null) {
                        const caretSegment = raw.slice(convertStart, caret);
                        pendingCaretRef.current = convertStart + toHiraganaIME(caretSegment).length;
                      }
                      setUserInput(nextValue);
                      lastRawValueRef.current = nextValue;
                      return;
                    }

                    setDidConvert(false);
                    if (caret !== null) pendingCaretRef.current = caret;
                    setUserInput(raw);
                    lastRawValueRef.current = raw;
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                    setIsComposing(true);
                  }}
                  onCompositionEnd={e => {
                    isComposingRef.current = false;
                    setIsComposing(false);
                    lastRawValueRef.current = e.currentTarget.value;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <KeyboardTip preferred="japanese" rawValue={rawInput} isComposing={isComposing} didConvert={didConvert} />
              </div>
              {diffNode}
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
        <div className="card prev-answers prev-answers-diff">
          <legend>{t('common.previousAnswers')}</legend>
          {prevAnswers.slice(0, 20).map((a, i) => (
            <div key={i} className={`prev-answer-item prev-answer-item-diff ${a.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
              <span className="icon">{a.isCorrect ? '✓' : '✗'}</span>
              <div className="prev-answer-body">
                <div className="prev-answer-q">{a.question}</div>
                {Array.isArray(a.diffOps) && (
                  <div className="diff-display diff-history">{renderDiff(a.diffOps as DiffUnitOp[])}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
