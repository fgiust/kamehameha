import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export type PreferredKeyboard = 'japanese' | 'latin';
type DetectedKeyboard = PreferredKeyboard | 'unknown';

type Props = {
  preferred: PreferredKeyboard;
  rawValue: string;
  isComposing?: boolean;
  didConvert?: boolean;
};

function hasLatinLetters(text: string) {
  return /[A-Za-z]/.test(text);
}

function hasKanji(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

export default function KeyboardTip({ preferred, rawValue, isComposing, didConvert }: Props) {
  const { t } = useTranslation();
  const detectedRef = useRef<DetectedKeyboard>('unknown');

  useEffect(() => {
    if (!rawValue.trim()) {
      detectedRef.current = 'unknown';
      return;
    }

    if (isComposing) {
      detectedRef.current = 'japanese';
      return;
    }

    if (didConvert) {
      detectedRef.current = 'latin';
      return;
    }

    if (hasKanji(rawValue)) {
      detectedRef.current = 'japanese';
      return;
    }

    if (hasLatinLetters(rawValue)) {
      detectedRef.current = 'latin';
    }
  }, [rawValue, isComposing, didConvert]);

  const detected = detectedRef.current;
  const shouldShow = detected !== 'unknown' && detected !== preferred;

  return (
    <div className={`keyboard-tip ${shouldShow ? 'is-visible' : 'is-hidden'}`}>
      {shouldShow ? t(`keyboardTip.${preferred}`) : '\u00A0'}
    </div>
  );
}
