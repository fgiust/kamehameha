import { useEffect, useRef } from 'react';

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

const MESSAGES: Record<PreferredKeyboard, string> = {
  japanese: 'tip: switch to japanese keyboard for kanji input',
  latin: 'tip: switch to latin keyboard for plain hiragana input without kanji replacement',
};

export default function KeyboardTip({ preferred, rawValue, isComposing, didConvert }: Props) {
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
      {shouldShow ? MESSAGES[preferred] : '\u00A0'}
    </div>
  );
}
