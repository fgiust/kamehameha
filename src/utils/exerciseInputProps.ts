import type { InputHTMLAttributes } from 'react';

type ExerciseAnswerInputProps = InputHTMLAttributes<HTMLInputElement> & {
  'data-1p-ignore'?: boolean;
  'data-lpignore'?: string;
  'data-bwignore'?: boolean;
  'data-form-type'?: string;
};

/** Drop readOnly on first focus (iOS contact autofill workaround without one-time-code). */
export function unlockExerciseAnswerInput(
  event: { currentTarget: HTMLInputElement },
): void {
  event.currentTarget.readOnly = false;
}

/** Suppress iOS contact bar and password-manager autofill on exercise answer fields. */
export const exerciseAnswerInputProps: ExerciseAnswerInputProps = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  inputMode: 'text',
  enterKeyHint: 'done',
  name: 'exercise-answer',
  readOnly: true,
  onFocus: unlockExerciseAnswerInput,
  'data-1p-ignore': true,
  'data-lpignore': 'true',
  'data-bwignore': true,
  'data-form-type': 'other',
};
