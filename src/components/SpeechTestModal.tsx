import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { speechTextFromRubyNotation } from 'tenshindiff';
import { speechTestPhrases } from '../data/speechTestPhrases';
import { resolveUiLang } from '../utils/bilingualPrompt';
import { stripSpeechTestHighlightMarkers } from '../utils/speechTestHighlight';
import { cancelSpeech, speakText } from '../utils/systemSpeech';
import SpeechTestJapaneseText from './SpeechTestJapaneseText';

const SPEECH_LANG = 'ja-JP';

export default function SpeechTestModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = resolveUiLang(i18n.resolvedLanguage ?? i18n.language);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) cancelSpeech();
  }, [isOpen]);

  if (!isOpen) return null;

  const speakPhrase = (phrase: string, mode: 'kanji' | 'kana') => {
    cancelSpeech();
    const plain = stripSpeechTestHighlightMarkers(phrase);
    speakText(speechTextFromRubyNotation(plain, mode), SPEECH_LANG);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content speech-test-modal" onClick={e => e.stopPropagation()}>
        <div className="feedback-panel-header">
          <h3 className="speech-test-title">{t('speechTest.title')}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('sentenceEdit.cancel')}
          >
            ×
          </button>
        </div>

        <p className="speech-test-intro">{t('speechTest.intro')}</p>

        <ul className="speech-test-list">
          {speechTestPhrases.map((phrase, index) => {
            const translation = lang === 'it' ? phrase.it : phrase.en;
            return (
              <li key={index} className="speech-test-item">
                <div className="speech-test-phrase">
                  <SpeechTestJapaneseText text={phrase.japanese} />
                  <p className="speech-test-translation">{translation}</p>
                </div>
                <div className="speech-test-actions">
                  <button
                    type="button"
                    className="speech-test-btn"
                    title={t('speechTest.speakKanji')}
                    aria-label={t('speechTest.speakKanji')}
                    onClick={() => speakPhrase(phrase.japanese, 'kanji')}
                  >
                    漢
                  </button>
                  <button
                    type="button"
                    className="speech-test-btn"
                    title={t('speechTest.speakKana')}
                    aria-label={t('speechTest.speakKana')}
                    onClick={() => speakPhrase(phrase.japanese, 'kana')}
                  >
                    あ
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
