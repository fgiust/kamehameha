import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useExerciseSessionDraft } from '../hooks/useExerciseSessionDraft';
import { usePersistExerciseDraft } from '../hooks/usePersistExerciseDraft';
import {
  buildExerciseFingerprint,
  clearExerciseSessionDraft,
  restoreSessionWordsFromDraft,
  sessionWordKeysFromWords,
} from '../utils/exerciseSessionDraft';
import { adjEngines, adjFormLabels } from '../engines/adjConjugation';
import { updateFeedbackDetails } from '../utils/feedback';
import { APP_TITLE_PREFIX, CONJUGATION_SESSION_TARGET_TOTAL, ConjugationWord, OptionFlags, PreviousAnswer, SETTINGS_KEYS } from '../types';
import { getConjugationFormHintLocalized, pickRandomSubset, readStoredBool, readStoredConjugationDisplaySettings, stripRubyTags, toKanaReading, toRubyInnerHtml, writeStoredBool } from '../utils/utils';
import { getConjugationPromptDisplay, matchesConjugationAnswer } from '../utils/conjugationAnswer';
import adjectives from '../data/dictConjugationAdjectives';
import { toHiragana } from 'wanakana';
import SessionProgressBar from '../components/SessionProgressBar';
import { useSessionProgress } from '../hooks/useSessionProgress';
import OptionToggle from '../components/OptionToggle';
import KeyboardTip from '../components/KeyboardTip';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import ExerciseCompletedMessage from '../components/ExerciseCompletedMessage';
import CopyablePlainText from '../components/CopyablePlainText';

const formIds = ['adj-conditionalform', 'adj-naruform', 'adj-negativeform', 'adj-pastform', 'adj-volitionalform'];
function formIdToShortKeyPart(formId: string) {
  return formId.replace(/^adj-/, '').replace(/form$/i, '');
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

const PERSIST_KEY = '/adj-randomize';

export default function AdjRandomizePage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const pageTitle = t('pages.randomizeAdj.title');
  const fingerprint = useMemo(
    () => buildExerciseFingerprint(PERSIST_KEY, adjectives.length),
    [],
  );
  const restoredDraft = useExerciseSessionDraft(PERSIST_KEY, fingerprint);
  const shouldRestoreSessionRef = useRef(Boolean(restoredDraft && !restoredDraft.isFinished));
  const didInitPickRef = useRef(false);
  const restoredExtras = restoredDraft?.extras;

  const [sessionWords] = useState<ConjugationWord[]>(() =>
    restoreSessionWordsFromDraft(adjectives, restoredDraft, () =>
      pickRandomSubset(adjectives, CONJUGATION_SESSION_TARGET_TOTAL),
    ),
  );
  const [settings, setSettings] = useState<GlobalSettings>(() => ({
    reverseQA: readStoredBool(SETTINGS_KEYS.reverseQA, false),
    ...readStoredConjugationDisplaySettings(),
  }));

  const [activeForms, setActiveForms] = useState<Record<string, boolean>>(() => {
    const saved = restoredExtras?.activeForms;
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      return saved as Record<string, boolean>;
    }
    const f: Record<string, boolean> = {};
    formIds.forEach(id => { f[id] = true; });
    return f;
  });
  const restoredIdx = restoredDraft?.currentIdx ?? 0;
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(restoredIdx);
  const [currentWord, setCurrentWord] = useState<ConjugationWord | null>(
    () => sessionWords[restoredIdx] ?? null,
  );
  const [isFinished, setIsFinished] = useState(restoredDraft?.isFinished ?? false);
  const [currentFormLabel, setCurrentFormLabel] = useState(
    () => (typeof restoredExtras?.currentFormLabel === 'string' ? restoredExtras.currentFormLabel : ''),
  );
  const [currentFlags, setCurrentFlags] = useState<OptionFlags>(
    () => (restoredExtras?.currentFlags && typeof restoredExtras.currentFlags === 'object'
      ? restoredExtras.currentFlags as OptionFlags
      : {}),
  );
  const [currentFormKey, setCurrentFormKey] = useState(
    () => (typeof restoredExtras?.currentFormKey === 'string' ? restoredExtras.currentFormKey : ''),
  );
  const [userInput, setUserInput] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [didConvert, setDidConvert] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [correct, setCorrect] = useState(restoredDraft?.correct ?? 0);
  const [incorrect, setIncorrect] = useState(restoredDraft?.incorrect ?? 0);
  const [inputState, setInputState] = useState<'' | 'correct' | 'incorrect'>('');
  const [diffDisplay, setDiffDisplay] = useState('');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<PreviousAnswer[]>(restoredDraft?.prevAnswers ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const remainingIdxRef = useRef<number[]>(restoredDraft?.picker.remainingIdx ?? []);
  const lastIdxRef = useRef<number | null>(restoredDraft?.picker.lastIdx ?? null);
  const phaseRef = useRef<0 | 2 | null>(restoredDraft?.picker.phase ?? null);
  const {
    segments: progressSegments,
    pulses: progressPulses,
    record: recordProgress,
    getState: getProgressState,
    getProgressSnapshot,
  } = useSessionProgress(sessionWords.length, {
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
      currentIdx: currentWordIdx,
      correct,
      incorrect,
      prevAnswers,
      isFinished,
      extras: {
        sessionWordKeys: sessionWordKeysFromWords(sessionWords),
        activeForms,
        currentFormKey,
        currentFormLabel,
        currentFlags,
      },
    }),
    [activeForms, correct, currentFlags, currentFormKey, currentFormLabel, currentWordIdx, incorrect, isFinished, prevAnswers, progressSegments, sessionWords, getProgressSnapshot],
  );

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
      setCurrentWord(null);
      setCurrentFormKey('');
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
    const word = sessionWords[nextIdx]!;

    const enabledForms = Object.entries(activeForms).filter(([, v]) => v).map(([k]) => k);
    const forms = enabledForms.length > 0 ? enabledForms : formIds;
    let form = '';
    let flags: OptionFlags = {};
    let label = '';
    let found = false;
    for (let tries = 0; tries < 20; tries++) {
      form = forms[Math.floor(Math.random() * forms.length)]!;
      const eng = adjEngines[form];
      flags = {};
      eng.opts.forEach(o => { flags[o.id] = Math.random() >= 0.5; });
      const wordKana = toKanaReading(word.japanese);
      const ans = eng.getAnswer(wordKana, word.type, flags);
      const answers = Array.isArray(ans) ? ans : [ans];
      if (!(answers.length === 1 && answers[0] === '')) {
        const optLabels = eng.opts.filter(o => flags[o.id]).map(o => o.label);
        const shortFormLabel = t(`formsShort.${formIdToShortKeyPart(form)}`);
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
    setCurrentFormKey(form);
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
  }, [activeForms, getProgressState, sessionWords, t]);

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
    pickNext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFinished) clearExerciseSessionDraft(PERSIST_KEY);
  }, [isFinished]);

  useEffect(() => {
    document.title = APP_TITLE_PREFIX + pageTitle;
  }, [i18n.language]);

  useEffect(() => {
    if (!currentWord || !currentFormKey || isFinished) return;
    const engine = adjEngines[currentFormKey];
    const hint = getConjugationFormHintLocalized(t, engine, currentFlags);

    const dictKana = toKanaReading(currentWord.japanese);
    const dictKanji = stripRubyTags(currentWord.japanese);

    let currentQuestion = '';
    let currentCorrectAnswer = '';

    if (settings.reverseQA) {
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      const kanaPrompt = answers.find(a => a !== '') || dictKana;
      currentQuestion = getConjugationPromptDisplay(
        currentWord.japanese,
        kanaPrompt,
        settings.showKanji,
        settings.showFurigana,
      ).plainText;
      currentCorrectAnswer = `${dictKana} (${dictKanji})`;
    } else {
      currentQuestion = settings.showKanji ? dictKanji : dictKana;
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      currentCorrectAnswer = answers.join(' / ');
    }

    updateFeedbackDetails({
      section: t('randomizeAdj.feedbackSection', { form: t(`formsShort.${formIdToShortKeyPart(currentFormKey)}`), hint }),
      question: currentQuestion,
      correctAnswer: currentCorrectAnswer,
      userAnswer: finalizeIME(userInput.trim()),
    });
  }, [currentWord, currentFormKey, currentFlags, settings.reverseQA, settings.showKanji, settings.showFurigana, userInput, isFinished, t]);

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
    if (!currentWord || !userInput.trim() || !currentFormKey) return;
    const engine = adjEngines[currentFormKey];
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
    const isCorrect = matchesConjugationAnswer(normalized, currentWord.japanese, answers);

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
  }, [awaitingNext, isFinished, currentWord, currentFormKey, currentFormLabel, currentFlags, settings.reverseQA, settings.showKanji, settings.showFurigana, settings.showType, settings.showEnglish, userInput, recordProgress, currentWordIdx]);

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

  const engine = currentFormKey ? adjEngines[currentFormKey] : null;
  const formHint = currentFormKey
    ? (adjFormLabels[currentFormKey] ? t(adjFormLabels[currentFormKey]!) : currentFormLabel)
    : (engine ? getConjugationFormHintLocalized(t, engine, currentFlags) : '');
  const displayedType = currentWord
    ? (currentWord.type === 'i' ? t('adjective.typeLabels.i') : t('adjective.typeLabels.na'))
    : '';

  const questionPlainCopy = useMemo(() => {
    if (!currentWord) return '';
    if (settings.reverseQA && engine) {
      const dictKana = toKanaReading(currentWord.japanese);
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      const kanaPrompt = answers.find(a => a !== '') || dictKana;
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
  }, [currentWord, settings.reverseQA, settings.showKanji, settings.showFurigana, engine, currentFlags]);

  const questionNode = (() => {
    if (!currentWord) return t('common.loading');
    if (settings.reverseQA && engine) {
      const dictKana = toKanaReading(currentWord.japanese);
      const answer = engine.getAnswer(dictKana, currentWord.type, currentFlags);
      const answers = Array.isArray(answer) ? answer : [answer];
      const kanaPrompt = answers.find(a => a !== '') || dictKana;
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

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 100;

  return (
    <PageLayout pageTitle={pageTitle}>
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
            <OptionToggle
              label={t('common.reverseQA')}
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
          <legend>{t('common.previousAnswers')}</legend>
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
