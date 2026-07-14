import { scheduleAnalyticsEvent } from './analyticsClient';
import { trackUmamiEvent } from './umami';

export type ProgressSegment = 0 | 1 | 2;

export function areAllSegmentsGreen(segments: ProgressSegment[]): boolean {
  return segments.length > 0 && segments.every(s => s === 1);
}

export function shouldTrackKamehamehaCompletion(wasAllGreen: boolean, nextAllGreen: boolean): boolean {
  return nextAllGreen && !wasAllGreen;
}

export function trackExerciseQuestion(exerciseId: string, correct: boolean): void {
  const data = { exercise: exerciseId, correct };
  trackUmamiEvent('question', data);
  scheduleAnalyticsEvent('question', data);
}

export function trackExerciseKamehameha(exerciseId: string): void {
  const data = { exercise: exerciseId };
  trackUmamiEvent('kamehameha', data);
  scheduleAnalyticsEvent('kamehameha', data);
}
