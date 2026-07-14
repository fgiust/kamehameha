import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  areAllSegmentsGreen,
  shouldTrackKamehamehaCompletion,
  trackExerciseKamehameha,
  trackExerciseQuestion,
} from '../../src/utils/exerciseAnalytics';

vi.mock('../../src/utils/umami', () => ({
  trackUmamiEvent: vi.fn(),
}));

vi.mock('../../src/utils/analyticsClient', () => ({
  scheduleAnalyticsEvent: vi.fn(),
}));

import { scheduleAnalyticsEvent } from '../../src/utils/analyticsClient';
import { trackUmamiEvent } from '../../src/utils/umami';

describe('exerciseAnalytics', () => {
  beforeEach(() => {
    vi.mocked(trackUmamiEvent).mockClear();
    vi.mocked(scheduleAnalyticsEvent).mockClear();
  });

  it('tracks question events with exercise id and correctness', () => {
    trackExerciseQuestion('/genki/08-3', true);
    expect(trackUmamiEvent).toHaveBeenCalledWith('question', { exercise: '/genki/08-3', correct: true });
    expect(scheduleAnalyticsEvent).toHaveBeenCalledWith('question', { exercise: '/genki/08-3', correct: true });

    trackExerciseQuestion('/numbers', false);
    expect(trackUmamiEvent).toHaveBeenCalledWith('question', { exercise: '/numbers', correct: false });
    expect(scheduleAnalyticsEvent).toHaveBeenCalledWith('question', { exercise: '/numbers', correct: false });
  });

  it('tracks kamehameha events with exercise id', () => {
    trackExerciseKamehameha('/time');
    expect(trackUmamiEvent).toHaveBeenCalledWith('kamehameha', { exercise: '/time' });
    expect(scheduleAnalyticsEvent).toHaveBeenCalledWith('kamehameha', { exercise: '/time' });
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
