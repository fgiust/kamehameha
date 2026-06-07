import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  areAllSegmentsGreen,
  shouldTrackKamehamehaCompletion,
  trackExerciseKamehameha,
  trackExerciseQuestion,
} from '../../src/utils/exerciseAnalytics';

vi.mock('@vercel/analytics', () => ({
  track: vi.fn(),
}));

import { track } from '@vercel/analytics';

describe('exerciseAnalytics', () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });

  it('tracks question events with exercise id and correctness', () => {
    trackExerciseQuestion('/genki/08-3', true);
    expect(track).toHaveBeenCalledWith('question', { exercise: '/genki/08-3', correct: true });

    trackExerciseQuestion('/numbers', false);
    expect(track).toHaveBeenCalledWith('question', { exercise: '/numbers', correct: false });
  });

  it('tracks kamehameha events with exercise id', () => {
    trackExerciseKamehameha('/time');
    expect(track).toHaveBeenCalledWith('kamehameha', { exercise: '/time' });
  });

  it('detects when all segments are green', () => {
    expect(areAllSegmentsGreen([])).toBe(false);
    expect(areAllSegmentsGreen([1, 0, 1])).toBe(false);
    expect(areAllSegmentsGreen([1, 1, 1])).toBe(true);
  });

  it('tracks kamehameha only on transition to all green', () => {
    expect(shouldTrackKamehamehaCompletion(false, false)).toBe(false);
    expect(shouldTrackKamehamehaCompletion(true, true)).toBe(false);
    expect(shouldTrackKamehamehaCompletion(true, false)).toBe(false);
    expect(shouldTrackKamehamehaCompletion(false, true)).toBe(true);
  });
});
