import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { verbEngines, verbFormLabels } from '../engines/verbConjugation';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, ConjugationWord, OptionFlags, PreviousAnswer, SETTINGS_KEYS } from '../types';
import { getConjugationFormHint, readStoredBool, stripRubyTags, toKanaReading, toRubyInnerHtml, writeStoredBool } from '../utils/utils';
import verbs from '../data/dictConjugationVerbs';
import { toHiragana } from 'wanakana';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import KeyboardTip from '../components/KeyboardTip';
import OptionToggle from '../components/OptionToggle';
import { useTranslation } from 'react-i18next';

const formIds = [
  'causativeform', 'conditionalform', 'imperativeform', 'negativeform',
  'passiveform', 'pastform', 'politeform', 'potentialform',
  'provisionalform', 'teform', 'volitionalform',
];

function formIdToShortKeyPart(formId: string) {
  return formId.replace(/form$/i, '');
}

type GlobalSettings = {
  reverseQA: boolean;
  showKanji: boolean;
  showFurigana: boolean;
  showType: boolean;
  showEnglish: boolean;
};

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

export default function RandomizePage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const pageTitle = t('pages.randomizeVerb.title');
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const showKanji = readStoredBool(SETTINGS_KEYS.showKanji, false);
    return {
      reverseQA: readStoredBool(SETTINGS_KEYS.reverseQA, false),
      showKanji,
      showFurigana: showKanji ? readStoredBool(SETTINGS_KEYS.showFurigana, false) : false,
      showType: readStoredBool(SETTINGS_KEYS.showType, true),
      showEnglish: readStoredBool(SETTINGS_KEYS.showEnglish, false),
    };
  });

  const [activeForms, setActiveForms] = useState<Record<string, boolean>>(() => {
    const f: Record<string, boolean> = {};
    formIds.forEach(id => { f[id] = true; });
    return f;
  });
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [currentWord, setCurrentWord] = useState<ConjugationWord | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [currentForm, setCurrentForm] = useState('');
  const [currentFormLabel, setCurrentFormLabel] = useState('');
  const [currentFlags, setCurrentFlags] = useState<OptionFlags>({});
  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [diffDisplay, setDiffDisplay] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const remainingIdxRef = useRef<number[]>([]);
  const lastIdxRef = useRef<number | null>(null);
  const phaseRef = useRef<0 | 2 | null>(null);
  const { segments: progressSegments, pulses: progressPulses, record: recordProgress, getState: getProgressState } = useSessionProgress(verbs.length, { persistKey: '/randomize' });

  const updateSetting = (key: keyof GlobalSettings, value: boolean) => {
    setSettings(s => {
      const next: GlobalSettings = { ...s, [key]: value };
      if (key === 'showKanji' && !value) next.showFurigana = false;
      return next;
    });
    writeStoredBool(SETTINGS_KEYS[key], value);
    if (key === 'showKanji' && !value) {
      writeStoredBool(SETTINGS_KEYS.showFurigana, false);
    }
  };

  const pickNext = useCallback(() => {
    if (verbs.length === 0) return;
    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < verbs.length; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) {
      setIsFinished(true);
      setCurrentWord(null);
      setCurrentForm('');
      setCurrentFormLabel('');
      setCurrentFlags({});
      setUserInput('');
      setRawInput('');
      setDidConvert(false);
      setIsComposing(false);
      setInputState('');
      setDiffDisplay('');
      setAwaitingNext(false);
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
    const word = verbs[nextIdx]!;

    const enabledForms = Object.entries(activeForms).filter(([, v]) => v).map(([k]) => k);
    const forms = enabledForms.length > 0 ? enabledForms : formIds;
    let form = '';
    let flags: OptionFlags = {};
    let label = '';
    let found = false;
    for (let tries = 0; tries < 20; tries++) {
      form = forms[Math.floor(Math.random() * forms.length)]!;
      const eng = verbEngines[form];
      flags = {};
      eng.opts.forEach(o => { flags[o.id] = Math.random() >= 0.5; });
      if (flags.polite !== undefined) flags.polite = false;
      const wordKana = toKanaReading(word.japanese);
      const ans = eng.getAnswer(wordKana, word.type, flags);
      const answers = Array.isArray(ans) ? ans : [ans];
      if (!(answers.length === 1 && answers[0] === '')) {
        const optLabels = eng.opts.filter(o => flags[o.id]).map(o => o.label);
        const shortKeyPart = formIdToShortKeyPart(form);
        const shortFormLabel = t(`formsShort.${shortKeyPart}`);
        label = (optLabels.length > 0 ? optLabels.join(' ') + ' ' : '') + shortFormLabel;
        found = true;
        break;
      }
    }
    if (!found) {
      remainingIdxRef.current.push(nextIdx);
      return;
    }

    setCurrentWord(word);
    setCurrentForm(form);
    setCurrentFormLabel(label);
    setCurrentFlags(flags);
    setUserInput('');
    setRawInput('');
    setDidConvert(false);
    setIsComposing(false);
    setInputState('');
    setDiffDisplay('');
    setAwaitingNext(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeForms, getProgressState, t]);

  useEffect(() => {
    remainingIdxRef.current = [];
    phaseRef.current = null;
    lastIdxRef.current = null;
    setIsFinished(false);
    pickNext();
  }, []); // eslint-disable-line

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + pageTitle;
  }, [i18n.language]);

  useEffect(() => {
    if (!currentWord || !currentForm || isFinished) return;
    const engine = verbEngines[currentForm];
    const hint = getConjugationFormHint(engine, currentFlags);

    const dictKana = toKanaReading(currentWord.japanese);
    const dictKanji = stripRubyTags(currentWord.japanese);

    let currentQuestion = '';
    let currentCorrectAnswer = '';

    if (settings.reverseQA) {
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      const prompt = answers.find(a => a !== '') || '';
      currentQuestion = prompt || dictKana;
      currentCorrectAnswer = `${dictKana} (${dictKanji})`;
    } else {
      currentQuestion = settings.showKanji ? dictKanji : dictKana;
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      currentCorrectAnswer = answers.join(' / ');
    }

    updateFeedbackDetails({
      section: t('randomizeVerb.feedbackSection', { form: t(`formsShort.${formIdToShortKeyPart(currentForm)}`), hint }),
      question: currentQuestion,
      correctAnswer: currentCorrectAnswer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentWord, currentForm, currentFlags, settings.reverseQA, settings.showKanji, userInput, isFinished, t]);

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
      return;
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
    if (!currentWord || !userInput.trim() || !currentForm) return;
    const engine = verbEngines[currentForm];
    const normalized = finalizeIME(userInput.trim());

    if (settings.reverseQA) {
      const dictKana = toKanaReading(currentWord.japanese);
      const dictKanji = stripRubyTags(currentWord.japanese);
      const acceptable = new Set([dictKana, dictKanji]);
      const isCorrect = acceptable.has(normalized);
      const correctDisplay = (() => {
        if (!settings.showKanji) return dictKana;
        return dictKanji;
      })();

      if (isCorrect) { setCorrect(c => c + 1); setInputState('correct'); }
      else { setIncorrect(c => c + 1); setInputState('incorrect'); }
      setDiffDisplay(correctDisplay);

      setPrevAnswers(prev => [{
        question: `${dictKana} → ${currentFormLabel}`,
        userAnswer: normalized,
        correctAnswer: correctDisplay,
        isCorrect,
      }, ...prev]);

      recordProgress(String(currentWordIdx), isCorrect);
      setAwaitingNext(true);
      return;
    }

    const dictKana = toKanaReading(currentWord.japanese);
    const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
    const answers = Array.isArray(answer) ? answer : [answer];
    const isCorrect = answers.some(a => a === normalized);

    if (isCorrect) { setCorrect(c => c + 1); setInputState('correct'); }
    else { setIncorrect(c => c + 1); setInputState('incorrect'); }
    setDiffDisplay(answers[0] || '');

    setPrevAnswers(prev => [{
      question: `${dictKana} → ${currentFormLabel}`,
      userAnswer: normalized,
      correctAnswer: answers[0] || '',
      isCorrect,
    }, ...prev]);

    recordProgress(String(currentWordIdx), isCorrect);
    setAwaitingNext(true);
  }, [awaitingNext, isFinished, currentWord, currentForm, currentFormLabel, currentFlags, settings.reverseQA, settings.showKanji, settings.showFurigana, settings.showType, settings.showEnglish, userInput, recordProgress, currentWordIdx]);

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
      if (nativeEvent.isComposing) return;
      e.preventDefault();
      checkAnswer();
    }
  };

  const engine = currentForm ? verbEngines[currentForm] : null;
  const formHint = currentForm
    ? (verbFormLabels[currentForm] ? t(verbFormLabels[currentForm]!) : currentFormLabel)
    : (engine ? getConjugationFormHint(engine, currentFlags) : '');
  const displayedType = currentWord
    ? (currentWord.type === 'u' ? t('verb.typeLabels.u') : currentWord.type === 'ru' ? t('verb.typeLabels.ru') : t('verb.typeLabels.irr'))
    : '';

  const questionNode = (() => {
    if (!currentWord) return t('common.loading');
    if (settings.reverseQA && engine) {
      const dictKana = toKanaReading(currentWord.japanese);
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      const prompt = answers.find(a => a !== '') || '';
      return (
        <ruby>
          {prompt || dictKana}
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

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  return (
    <div className="app-container">
      <div className="page-header">
        <h1 className="page-heading">{pageTitle}</h1>
        <div className="page-actions">
          <Link to="/" className="header-btn" aria-label={t('common.back')}>{'<'}</Link>
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
                {showEnglish && <div className="exercise-meta-item is-english">{lang === 'it' ? currentWord!.it : currentWord!.en}</div>}
                {showType && <div className="exercise-meta-item is-type">{displayedType}</div>}
                {isEmpty && <div className="exercise-meta-item">&nbsp;</div>}
              </div>
            );
          })()}

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
          <div className="options-section-label">{t('common.forms')}</div>

          <div className="switches">
            {formIds.map(id => (
              <OptionToggle
                key={id}
                label={t(`formsShort.${formIdToShortKeyPart(id)}`)}
                checked={!!activeForms[id]}
                onChange={() => setActiveForms(f => ({ ...f, [id]: !f[id] }))}
              />
            ))}
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
    </div>
  );
}
