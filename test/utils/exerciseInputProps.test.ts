// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { exerciseAnswerInputProps, unlockExerciseAnswerInput } from '../../src/utils/exerciseInputProps';

describe('exerciseAnswerInputProps', () => {
  it('opts out of password managers and generic autofill', () => {
    expect(exerciseAnswerInputProps.autoComplete).toBe('off');
    expect(exerciseAnswerInputProps['data-1p-ignore']).toBe(true);
    expect(exerciseAnswerInputProps['data-lpignore']).toBe('true');
    expect(exerciseAnswerInputProps['data-bwignore']).toBe(true);
    expect(exerciseAnswerInputProps['data-form-type']).toBe('other');
  });

  it('unlocks readOnly on focus', () => {
    const input = document.createElement('input');
    input.readOnly = true;
    unlockExerciseAnswerInput({ currentTarget: input });
    expect(input.readOnly).toBe(false);
  });
});
