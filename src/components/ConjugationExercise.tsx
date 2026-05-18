import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE_PREFIX, ConjugationWord, ConjugationEngine, OptionFlags, PreviousAnswer, TypeLabels, SETTINGS_KEYS, getConjugationFormHint, readStoredBool, stripRubyTags, updateFeedbackDetails, writeStoredBool } from '../types';
import { toHiragana } from 'wanakana';
import SessionProgressBar from './SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from './OptionToggle';
import KeyboardTip from './KeyboardTip';

interface Props {
  title: string;
  wordData: ConjugationWord[];
  engine: ConjugationEngine;
  typeLabels: TypeLabels;
  formLabel?: string;
  backPath: string;
  persistKey?: string;
}

type GlobalSettings = {
  randomizeForm: boolean;
  reverseQA: boolean;
  showKanji: boolean;
  showFurigana: boolean;
  showType: boolean;
  showEnglish: boolean;
};

function readStoredShowType(fallback: boolean) {
  try {
    const existing = localStorage.getItem(SETTINGS_KEYS.showType);
    if (existing !== null) return existing === 'true';

    const legacyHideType = localStorage.getItem('nihongo.conj.hideType');
    if (legacyHideType === null) return fallback;

    const showType = legacyHideType !== 'true';
    localStorage.setItem(SETTINGS_KEYS.showType, showType ? 'true' : 'false');
    localStorage.removeItem('nihongo.conj.hideType');
    return showType;
  } catch {
    return fallback;
  }
}

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

function serializeFlags(engine: ConjugationEngine, flags: OptionFlags) {
  return engine.opts.map(o => `${o.id}:${flags[o.id] ? '1' : '0'}`).join(',');
}

export default function ConjugationExercise({ title, wordData, engine, typeLabels, formLabel, backPath, persistKey }: Props) {
  const [flags, setFlags] = useState<OptionFlags>(() => buildDefaultFlags(engine));
  const [randomFlags, setRandomFlags] = useState<OptionFlags>(() => buildDefaultFlags(engine));
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasReverseParam = searchParams.get('reverse') === 'true' || searchParams.get('reverseQA') === 'true';

    let reverseQA = readStoredBool(SETTINGS_KEYS.reverseQA, false);
    if (hasReverseParam) {
      reverseQA = true;
      try {
        localStorage.setItem(SETTINGS_KEYS.reverseQA, 'true');
      } catch {
        // noop
      }
    }

    const showKanji = readStoredBool(SETTINGS_KEYS.showKanji, false);
    return {
      randomizeForm: readStoredBool(SETTINGS_KEYS.randomizeForm, false),
      reverseQA,
      showKanji,
      showFurigana: showKanji ? readStoredBool(SETTINGS_KEYS.showFurigana, false) : false,
      showType: readStoredShowType(true),
      showEnglish: readStoredBool(SETTINGS_KEYS.showEnglish, false),
    };
  });
  const [currentWord, setCurrentWord] = useState<ConjugationWord | null>(null);
  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [diffDisplay, setDiffDisplay] = useState<string>('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [seenWordKeys, setSeenWordKeys] = useState<Record<string, true>>({});
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const totalWords = wordData.length;
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress } = useSessionProgress(totalWords, { persistKey });

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

  const getWordKey = (w: ConjugationWord) => `${w.type}:${w.kana}:${stripRubyTags(w.kanji)}`;

  const pickWord = useCallback(() => {
    if (wordData.length === 0) return;

    const unseen = wordData.filter(w => !seenWordKeys[getWordKey(w)]);
    const pool = unseen.length > 0 ? unseen : wordData;

    let word = pool[Math.floor(Math.random() * pool.length)];
    // Try to avoid repeating
    if (pool.length > 1 && currentWord && word.kana === currentWord.kana) {
      word = pool[Math.floor(Math.random() * pool.length)];
    }
    setCurrentWord(word);
    setSeenWordKeys(prev => {
      const key = getWordKey(word);
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
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
  }, [currentWord, engine, seenWordKeys, settings.randomizeForm, wordData]);

  useEffect(() => { pickWord(); }, []); // eslint-disable-line

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + title;
  }, [title]);

  // Update feedback details globally
  useEffect(() => {
    if (!currentWord) return;
    const effectiveFlags = settings.randomizeForm ? randomFlags : flags;
    const displayFormHint = getConjugationFormHint(engine, effectiveFlags);

    const dictKana = currentWord.kana;
    const dictKanji = stripRubyTags(currentWord.kanji);

    let currentQuestion = '';
    let currentCorrectAnswer = '';

    if (settings.reverseQA) {
      const base = settings.showKanji ? currentWord.kanji : dictKana;
      const promptAnswer = engine.getAnswer(base, currentWord.type, effectiveFlags);
      const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
      const prompt = promptAnswers.find(a => a !== '') || '';
      currentQuestion = prompt || base;
      currentCorrectAnswer = `${dictKana} (${dictKanji})`;
    } else {
      currentQuestion = settings.showKanji ? currentWord.kanji : dictKana;
      const answer = engine.getAnswer(currentWord.kana, currentWord.type, effectiveFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      currentCorrectAnswer = answers.join(' / ');
    }

    updateFeedbackDetails({
      section: `${title} (${displayFormHint})`,
      question: stripRubyTags(currentQuestion),
      correctAnswer: currentCorrectAnswer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentWord, title, settings.reverseQA, settings.showKanji, flags, randomFlags, settings.randomizeForm, userInput]);

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
    if (!currentWord || !userInput.trim()) return;
    const effectiveFlags = settings.randomizeForm ? randomFlags : flags;

    const normalized = finalizeIME(userInput.trim());
    const progressKey = `${getWordKey(currentWord)}|${settings.reverseQA ? 'rev' : 'fwd'}|${serializeFlags(engine, effectiveFlags)}`;

    if (settings.reverseQA) {
      const dictKana = currentWord.kana;
      const dictKanji = stripRubyTags(currentWord.kanji);
      const acceptable = new Set([dictKana, dictKanji]);
      const isCorrect = acceptable.has(normalized);
      const correctDisplay = (() => {
        if (!settings.showKanji) return dictKana;
        if (settings.showFurigana) return currentWord.kanji;
        return dictKanji;
      })();

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
        const base = (() => {
          if (!settings.showKanji) return dictKana;
          if (settings.showFurigana) return currentWord.kanji;
          return dictKanji;
        })();
        const promptAnswer = engine.getAnswer(base, currentWord.type, effectiveFlags);
        const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
        const prompt = promptAnswers.find(a => a !== '') || '';
        const shown = prompt || base;
        return settings.showKanji ? stripRubyTags(shown) : shown;
      })();

      setPrevAnswers(prev => [{
        question: basePrompt,
        userAnswer: normalized,
        correctAnswer: dictKana,
        isCorrect,
      }, ...prev]);

      recordProgress(progressKey, isCorrect);
      setAwaitingNext(true);
      return;
    }

    const answer = engine.getAnswer(currentWord.kana, currentWord.type, effectiveFlags);
    const answers = Array.isArray(answer) ? answer : [answer];
    if (answers.length === 1 && answers[0] === '') { pickWord(); return; }

    const isCorrect = answers.some(a => a === normalized);

    if (isCorrect) {
      setCorrect(c => c + 1);
      setInputState('correct');
      setDiffDisplay(answers[0]);
    } else {
      setIncorrect(c => c + 1);
      setInputState('incorrect');
      setDiffDisplay(answers[0]);
    }

    const questionText = settings.showKanji ? stripRubyTags(currentWord.kanji) : currentWord.kana;
    setPrevAnswers(prev => [{
      question: questionText,
      userAnswer: normalized,
      correctAnswer: answers[0],
      isCorrect,
    }, ...prev]);

    recordProgress(progressKey, isCorrect);
    setAwaitingNext(true);
  }, [awaitingNext, currentWord, userInput, engine, flags, randomFlags, pickWord, settings.randomizeForm, settings.reverseQA, settings.showKanji, settings.showFurigana, recordProgress]);

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
  const formHint = getConjugationFormHint(engine, effectiveFlags);

  const questionNode = (() => {
    if (!currentWord) return '...';

    if (settings.reverseQA) {
      const dictKana = currentWord.kana;
      const base = (() => {
        if (!settings.showKanji) return dictKana;
        if (settings.showFurigana) return currentWord.kanji;
        return stripRubyTags(currentWord.kanji);
      })();
      const promptAnswer = engine.getAnswer(base, currentWord.type, effectiveFlags);
      const promptAnswers = Array.isArray(promptAnswer) ? promptAnswer : [promptAnswer];
      const prompt = promptAnswers.find(a => a !== '') || '';
      const shown = prompt || base;
      if (shown.includes('<rt>')) {
        return <ruby dangerouslySetInnerHTML={{ __html: shown }} />;
      }
      return (
        <ruby>
          {shown}
          <rt aria-hidden="true">&nbsp;</rt>
        </ruby>
      );
    }

    if (!settings.showKanji) {
      return (
        <ruby>
          {currentWord.kana}
          <rt aria-hidden="true">&nbsp;</rt>
        </ruby>
      );
    }
    return <ruby dangerouslySetInnerHTML={{ __html: currentWord.kanji }} />;
  })();

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{title}</h1>
        <div className="page-actions">
          <Link to={backPath} className="header-btn" aria-label="Back">{'<'}</Link>
        </div>
      </div>

      <div className="card">
        <div className="exercise-container">
          <div className={`exercise-question is-japanese ${!settings.showFurigana ? 'is-furigana-hidden' : ''}`}>
            {questionNode}
          </div>
          <div className="form-hint">{formHint}</div>
          {(() => {
            const showEnglish = !!currentWord && settings.showEnglish;
            const showType = !!currentWord && settings.showType && !!displayedType;
            const layoutClass = showEnglish && showType ? 'is-split' : 'is-centered';
            const isEmpty = !showEnglish && !showType;
            return (
              <div className={`exercise-meta-row ${layoutClass} ${isEmpty ? 'is-empty' : ''}`}>
                {showEnglish && <div className="exercise-meta-item is-english">{currentWord!.eng}</div>}
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
        </div>

        <div className="options-panel">
          <div className="switches">
            <OptionToggle
              label="Kanji"
              checked={settings.showKanji}
              onChange={val => updateSetting('showKanji', val)}
            />
            <OptionToggle
              label="Furigana ⇧"
              checked={settings.showFurigana}
              disabled={!settings.showKanji}
              onChange={val => updateSetting('showFurigana', val)}
            />
            <OptionToggle
              label="English"
              checked={settings.showEnglish}
              onChange={val => updateSetting('showEnglish', val)}
            />
            <OptionToggle
              label="Type"
              checked={settings.showType}
              onChange={val => updateSetting('showType', val)}
            />
            <OptionToggle
              label="Reverse Q-A"
              checked={settings.reverseQA}
              onChange={val => updateSetting('reverseQA', val)}
            />
          </div>

          <div className="options-divider" />
          <div className="options-section-label">Forms:</div>

          <div className="switches">

            {engine.opts.map(o => (
              <OptionToggle
                key={o.id}
                label={o.label}
                checked={!!effectiveFlags[o.id]}
                disabled={settings.randomizeForm}
                onChange={() => toggleFlag(o.id)}
              />
            ))}

            <OptionToggle
              label="Randomize"
              checked={settings.randomizeForm}
              onChange={next => {
                updateSetting('randomizeForm', next);
                if (next) setRandomFlags(buildRandomFlags(engine));
              }}
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
