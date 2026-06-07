import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
  restoreSessionWordsFromDraft,
  sessionWordKeysFromWords,
} from '../utils/exerciseSessionDraft';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, CONJUGATION_SESSION_TARGET_TOTAL, ConjugationWord, ConjugationEngine, OptionFlags, PreviousAnswer, TypeLabels, SETTINGS_KEYS } from '../types';
import { getConjugationFormHintLocalized, pickRandomSubset, readStoredBool, readStoredConjugationDisplaySettings, stripRubyTags, toKanaReading, toRubyInnerHtml, writeStoredBool } from '../utils/utils';
import { getConjugationPromptDisplay, getReverseQAResponse, matchesConjugationAnswer, matchesReverseQAAnswer } from '../utils/conjugationAnswer';
import { toHiragana } from 'wanakana';
import SessionProgressBar from './SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from './OptionToggle';
import KeyboardTip from './KeyboardTip';
import { useTranslation } from 'react-i18next';
import PageLayout from './PageLayout';
import ExerciseCompletedMessage from './ExerciseCompletedMessage';
import CopyablePlainText from './CopyablePlainText';

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.25" />
      <circle cx="15.5" cy="8.5" r="1.25" />
      <circle cx="12" cy="12" r="1.25" />
      <circle cx="8.5" cy="15.5" r="1.25" />
      <circle cx="15.5" cy="15.5" r="1.25" />
    </svg>
  );
}

interface Props {
  title: string;
  wordData: ConjugationWord[];
  engine: ConjugationEngine;
  typeLabels: TypeLabels;
  formLabel?: string;
  persistKey?: string;
  forceReverseQA?: boolean;
}

type GlobalSettings = {
  randomizeForm: boolean;
  showKanji: boolean;
  showFurigana: boolean;
  showType: boolean;
  showEnglish: boolean;
};


function buildDefaultFlags(engine: ConjugationEngine) {
  const f: OptionFlags = {};
  engine.opts.forEach(o => { f[o.id] = false; });
  return f;
}

function buildRandomFlags(engine: ConjugationEngine) {
  const f: OptionFlags = {};
  engine.opts.forEach(o => { f[o.id] = Math.random() >= 0.5; });
  return f;
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
  if (input.endsWith('n')) return input.slice(0, -1) + 'ん';
  return input;
}

export default function ConjugationExercise({ title, wordData, engine, typeLabels, formLabel, persistKey, forceReverseQA }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const fingerprint = useMemo(
    () => buildExerciseFingerprint(persistKey ?? title, wordData.length),
    [persistKey, title, wordData.length],
  );
  const restoredDraft = useExerciseSessionDraft(persistKey, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);

  const [sessionWords] = useState<ConjugationWord[]>(() =>
    restoreSessionWordsFromDraft(wordData, restoredDraft, () =>
      pickRandomSubset(wordData, CONJUGATION_SESSION_TARGET_TOTAL),
    ),
  );
  const [flags, setFlags] = useState<OptionFlags>(() => buildDefaultFlags(engine));
  const [randomFlags, setRandomFlags] = useState<OptionFlags>(() => buildDefaultFlags(engine));
  const [settings, setSettings] = useState<GlobalSettings>(() => ({
    randomizeForm: readStoredBool(SETTINGS_KEYS.randomizeForm, false),
    ...readStoredConjugationDisplaySettings(),
  }));
  const reverseQA = !!forceReverseQA;
  const restoredIdx = restoredDraft?.currentIdx ?? 0;
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(restoredIdx);
  const [currentWord, setCurrentWord] = useState<ConjugationWord | null>(
    () => sessionWords[restoredIdx] ?? null,
  );
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);
  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [diffDisplay, setDiffDisplay] = useState<string>('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>(restoredDraft?.prevAnswers ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const remainingIdxRef = useRef<number[]>(restoredDraft?.picker.remainingIdx ?? []);
  const lastIdxRef = useRef<number | null>(restoredDraft?.picker.lastIdx ?? null);
  const phaseRef = useRef<0 | 2 | null>(restoredDraft?.picker.phase ?? null);
  const totalWords = sessionWords.length;
  const {
    segments: progressSegments,
    pulses: progressPulses,
    record: recordProgress,
    getState: getProgressState,
    getProgressSnapshot,
  } = useSessionProgress(totalWords, {
    persistKey,
    initialProgress: restoredDraft?.progress,
  });

  const { persistNow } = usePersistExerciseDraft(
    persistKey,
    fingerprint,
    () => ({
      progress: getProgressSnapshot(),
      picker: {
        remainingIdx: [...remainingIdxRef.current],
        phase: phaseRef.current,
        lastIdx: lastIdxRef.current,
      },
      currentIdx: currentWordIdx,
      correct,
      incorrect,
      prevAnswers,
      isFinished,
      extras: { sessionWordKeys: sessionWordKeysFromWords(sessionWords) },
    }),
    [currentWordIdx, correct, incorrect, isFinished, prevAnswers, progressSegments, sessionWords, getProgressSnapshot],
  );

  const updateSetting = (key: keyof GlobalSettings, value: boolean) => {
    setSettings(s => {
      const next: GlobalSettings = { ...s, [key]: value };

      if (key === 'showKanji' && !value) {
        next.showFurigana = false;
        writeStoredBool(SETTINGS_KEYS.showFurigana, false);
      }

      if (!next.showKanji) {
        next.showFurigana = false;
      }

      return next;
    });
    writeStoredBool(SETTINGS_KEYS[key], value);
    if (key === 'showType') {
      try {
        localStorage.removeItem('nihongo.conj.hideType');
      } catch {
        return;
      }
    }
  };

  const pickWord = useCallback(() => {
    if (sessionWords.length === 0) return;

    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < sessionWords.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setAwaitingNext(false);
      setInputState('');
      setDiffDisplay('');
      setUserInput('');
      setRawInput('');
      setDidConvert(false);
      setIsComposing(false);
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
    setCurrentWordIdx(nextIdx);
    const word = sessionWords[nextIdx]!;
    setCurrentWord(word);
    if (settings.randomizeForm) {
      setRandomFlags(buildRandomFlags(engine));
    }
    setUserInput('');
    setRawInput('');
    setDidConvert(false);
    setIsComposing(false);
    setInputState('');
    setDiffDisplay('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [engine, settings.randomizeForm, sessionWords, getProgressState]);

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
    setIsFinished(false);
    pickWord();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFinished && persistKey) {
      clearExerciseSessionDraft(persistKey);
    }
  }, [isFinished, persistKey]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + title;
  }, [title]);

  // Update feedback details globally
  useEffect(() => {
    if (!currentWord || isFinished) return;
    const effectiveFlags = settings.randomizeForm ? randomFlags : flags;
    const displayFormHint = getConjugationFormHintLocalized(t, engine, effectiveFlags);

    const dictKana = toKanaReading(currentWord.japanese);
    const dictKanji = stripRubyTags(currentWord.japanese);

    let currentQuestion = '';
    let currentCorrectAnswer = '';

    if (reverseQA) {
      const dictKana = toKanaReading(currentWord.japanese);
      const promptAnswer = engine.getAnswer(dictKana, currentWord.type, effectiveFlags);
      const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
      const kanaPrompt = promptAnswers.find(a => a !== '') || dictKana;
      const promptDisplay = getConjugationPromptDisplay(
        currentWord.japanese,
        kanaPrompt,
        settings.showKanji,
        settings.showFurigana,
      );
      const responseDisplay = getReverseQAResponse(
        engine,
        currentWord.japanese,
        currentWord.type,
        effectiveFlags,
        settings.showKanji,
        settings.showFurigana,
      ).display;
      currentQuestion = promptDisplay.plainText;
      currentCorrectAnswer = responseDisplay.plainText;
    } else {
      currentQuestion = settings.showKanji ? dictKanji : dictKana;
      const answer = engine.getAnswer(dictKana, currentWord.type, effectiveFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      currentCorrectAnswer = answers.join(' / ');
    }

    updateFeedbackDetails({
      section: `${title} (${displayFormHint})`,
      question: stripRubyTags(currentQuestion),
      correctAnswer: currentCorrectAnswer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentWord, title, reverseQA, settings.showKanji, settings.showFurigana, flags, randomFlags, settings.randomizeForm, userInput, isFinished, t, engine]);

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
    pickWord();
  }, [pickWord]);

  useEffect(() => {
    setFlags(buildDefaultFlags(engine));
    setRandomFlags(buildDefaultFlags(engine));
  }, [engine]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Shift' || e.repeat) return;
      if (!settings.showKanji) return;
      updateSetting('showFurigana', !settings.showFurigana);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.showKanji, settings.showFurigana]);

  const checkAnswer = useCallback(() => {
    if (awaitingNext) return;
    if (isFinished) return;
    if (!currentWord || !userInput.trim()) return;
    const effectiveFlags = settings.randomizeForm ? randomFlags : flags;

    const normalized = finalizeIME(userInput.trim());

    if (reverseQA) {
      const reverseResponse = getReverseQAResponse(
        engine,
        currentWord.japanese,
        currentWord.type,
        effectiveFlags,
        settings.showKanji,
        settings.showFurigana,
      );
      const isCorrect = matchesReverseQAAnswer(normalized, currentWord.japanese, reverseResponse.kanaAnswers);
      const correctDisplay = reverseResponse.display.mode === 'ruby' && settings.showFurigana
        ? toRubyInnerHtml(reverseResponse.display.displayText)
        : reverseResponse.display.plainText;

      if (isCorrect) {
        setCorrect(c => c + 1);
        setInputState('correct');
        setDiffDisplay(correctDisplay);
      } else {
        setIncorrect(c => c + 1);
        setInputState('incorrect');
        setDiffDisplay(correctDisplay);
      }

      const basePrompt = (() => {
        const dictKana = toKanaReading(currentWord.japanese);
        const promptAnswer = engine.getAnswer(dictKana, currentWord.type, effectiveFlags);
        const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
        const kanaPrompt = promptAnswers.find(a => a !== '') || dictKana;
        return getConjugationPromptDisplay(
          currentWord.japanese,
          kanaPrompt,
          settings.showKanji,
          settings.showFurigana,
        ).plainText;
      })();

      setPrevAnswers(prev => [{
        question: basePrompt,
        userAnswer: normalized,
        correctAnswer: reverseResponse.display.plainText,
        isCorrect,
      }, ...prev]);

      recordProgress(String(currentWordIdx), isCorrect);
      setAwaitingNext(true);
      persistNow();
      return;
    }

    const dictKana = toKanaReading(currentWord.japanese);
    const dictKanji = stripRubyTags(currentWord.japanese);
    const answer = engine.getAnswer(dictKana, currentWord.type, effectiveFlags);
    const answers = Array.isArray(answer) ? answer : [answer];
    if (answers.length === 1 && answers[0] === '') { pickWord(); return; }

    const isCorrect = matchesConjugationAnswer(normalized, currentWord.japanese, answers);

    if (isCorrect) {
      setCorrect(c => c + 1);
      setInputState('correct');
      setDiffDisplay(answers[0]);
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
      setDiffDisplay(answers[0]);
    }

    const questionText = settings.showKanji ? dictKanji : dictKana;
    setPrevAnswers(prev => [{
      question: questionText,
      userAnswer: normalized,
      correctAnswer: answers[0],
      isCorrect,
    }, ...prev]);

    recordProgress(String(currentWordIdx), isCorrect);
    setAwaitingNext(true);
    persistNow();
  }, [awaitingNext, isFinished, currentWord, userInput, engine, flags, randomFlags, pickWord, settings.randomizeForm, reverseQA, settings.showKanji, settings.showFurigana, recordProgress, currentWordIdx, persistNow]);

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
      checkAnswer();
    }
  };

  const toggleFlag = (id: string) => {
    setFlags(f => ({ ...f, [id]: !f[id] }));
  };

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  const effectiveFlags = settings.randomizeForm ? randomFlags : flags;
  const displayedType = currentWord ? typeLabels[currentWord.type] : '';
  const formHint = getConjugationFormHintLocalized(t, engine, effectiveFlags);
  const getOptionLabel = (id: string, fallback: string) => {
    if (id === 'neg') return t('conjugationHint.negative');
    if (id === 'polite') return t('conjugationHint.polite');
    const localized = t(`conjugationHint.opts.${id}`);
    return localized === `conjugationHint.opts.${id}` ? fallback : localized;
  };

  const questionPlainCopy = useMemo(() => {
    if (!currentWord) return '';
    if (reverseQA) {
      const dictKana = toKanaReading(currentWord.japanese);
      const promptAnswer = engine.getAnswer(dictKana, currentWord.type, effectiveFlags);
      const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
      const kanaPrompt = promptAnswers.find(a => a !== '') || dictKana;
      return getConjugationPromptDisplay(
        currentWord.japanese,
        kanaPrompt,
        settings.showKanji,
        settings.showFurigana,
      ).plainText;
    }
    if (!settings.showKanji) {
      return toKanaReading(currentWord.japanese);
    }
    return stripRubyTags(currentWord.japanese);
  }, [currentWord, reverseQA, settings.showKanji, settings.showFurigana, engine, effectiveFlags]);

  const questionNode = (() => {
    if (!currentWord) return t('common.loading');

    if (reverseQA) {
      const dictKana = toKanaReading(currentWord.japanese);
      const promptAnswer = engine.getAnswer(dictKana, currentWord.type, effectiveFlags);
      const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
      const kanaPrompt = promptAnswers.find(a => a !== '') || dictKana;
      const promptDisplay = getConjugationPromptDisplay(
        currentWord.japanese,
        kanaPrompt,
        settings.showKanji,
        settings.showFurigana,
      );

      if (promptDisplay.mode === 'ruby') {
        return <ruby dangerouslySetInnerHTML={{ __html: toRubyInnerHtml(promptDisplay.displayText) }} />;
      }

      return (
        <ruby>
          {promptDisplay.displayText}
          <rt aria-hidden="true">&nbsp;</rt>
        </ruby>
      );
    }

    if (!settings.showKanji) {
      const dictKana = toKanaReading(currentWord.japanese);
      return (
        <ruby>
          {dictKana}
          <rt aria-hidden="true">&nbsp;</rt>
        </ruby>
      );
    }

    if (settings.showFurigana) {
      return <ruby dangerouslySetInnerHTML={{ __html: toRubyInnerHtml(currentWord.japanese) }} />;
    }

    return (
      <ruby>
        {stripRubyTags(currentWord.japanese)}
        <rt aria-hidden="true">&nbsp;</rt>
      </ruby>
    );
  })();

  return (
    <PageLayout pageTitle={title}>
      <div className="card">
        <div className="exercise-container">
          {isFinished && <ExerciseCompletedMessage />}
          {!isFinished && (
            <>
              <CopyablePlainText
                plainText={questionPlainCopy}
                className={`exercise-question is-japanese ${!settings.showFurigana ? 'is-furigana-hidden' : ''}`}
              >
                {questionNode}
              </CopyablePlainText>
              <div className="form-hint">{formHint}</div>
              {(() => {
                const showEnglish = !!currentWord && settings.showEnglish;
                const showType = !!currentWord && settings.showType && !!displayedType;
                const layoutClass = showEnglish && showType ? 'is-split' : 'is-centered';
                const isEmpty = !showEnglish && !showType;
                return (
                  <div className={`exercise-meta-row ${layoutClass} ${isEmpty ? 'is-empty' : ''}`}>
                    {showEnglish && <div className="exercise-meta-item is-english">{lang === 'it' ? currentWord!.it : currentWord!.en}</div>}
                    {showType && <div className="exercise-meta-item is-type">{displayedType}</div>}
                    {isEmpty && <div className="exercise-meta-item">&nbsp;</div>}
                  </div>
                );
              })()}
              {formLabel && <div className="exercise-form-label">{formLabel}</div>}
              <div className="exercise-input-block">
                <input
                  ref={inputRef}
                  className={`exercise-input ${inputState}`}
                  value={userInput}
                  onChange={e => {
                    if (awaitingNext) return;
                    const raw = e.target.value;
                    setRawInput(raw);
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
                    const caret = e.target.selectionStart;
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
                  placeholder=""
                  autoCorrect="off"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <KeyboardTip preferred="latin" rawValue={rawInput} isComposing={isComposing} didConvert={didConvert} />
              </div>
              <div className={`answer-banner ${diffDisplay ? (inputState === 'correct' ? 'is-correct' : inputState === 'incorrect' ? 'is-incorrect' : '') : 'is-empty'}`}>
                {diffDisplay
                  ? (settings.showKanji && settings.showFurigana && diffDisplay.includes('<rt>')
                    ? <ruby dangerouslySetInnerHTML={{ __html: diffDisplay }} />
                    : diffDisplay)
                  : '\u00A0'}
              </div>
            </>
          )}
        </div>

        <div className="options-panel">
          <div className="switches">
            <OptionToggle
              label={t('common.kanji')}
              checked={settings.showKanji}
              onChange={val => updateSetting('showKanji', val)}
            />
            <OptionToggle
              label={t('common.furigana')}
              checked={settings.showFurigana}
              disabled={!settings.showKanji}
              onChange={val => updateSetting('showFurigana', val)}
            />
            <OptionToggle
              label={t('common.translation')}
              checked={settings.showEnglish}
              onChange={val => updateSetting('showEnglish', val)}
            />
            <OptionToggle
              label={t('common.type')}
              checked={settings.showType}
              onChange={val => updateSetting('showType', val)}
            />
          </div>

          <div className="options-divider" />
          <div className="options-section-label">{t('common.forms')}</div>

          <div className="switches switches-forms">
            <div className="switches-forms-cluster">
              <div className="switches-forms-variable">
                {settings.randomizeForm ? (
                  <span className="switches-forms-randomize-label">{t('conjugation.randomizeActiveLabel')}</span>
                ) : (
                  engine.opts.map(o => (
                    <OptionToggle
                      key={o.id}
                      label={getOptionLabel(o.id, o.label)}
                      checked={!!effectiveFlags[o.id]}
                      onChange={() => toggleFlag(o.id)}
                    />
                  ))
                )}
              </div>
              <span className="switches-forms-separator" aria-hidden="true" />
              <OptionToggle
                className="switch-item--randomize"
                label={<DiceIcon className="randomize-dice-icon" />}
                ariaLabel={t('conjugation.randomizeAriaLabel')}
                title={t('conjugation.randomizeTitle')}
                checked={settings.randomizeForm}
                onChange={next => {
                  updateSetting('randomizeForm', next);
                  if (next) setRandomFlags(buildRandomFlags(engine));
                }}
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

      {prevAnswers.length > 0 && (
        <div className="card prev-answers">
          <legend>{t('common.previousAnswers')}</legend>
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
    </PageLayout>
  );
}
