/** Suppress iOS Safari contact/password autofill bar on exercise answer fields. */
export const exerciseAnswerInputProps = {
  autoComplete: 'one-time-code',
  autoCorrect: 'off',
  autoCapitalize: 'none' as const,
  spellCheck: false,
  inputMode: 'text' as const,
  enterKeyHint: 'done' as const,
  name: 'exercise-answer',
};
