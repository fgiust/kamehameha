import { track } from '@vercel/analytics';

export type ProgressSegment = 0 | 1 | 2;

export function areAllSegmentsGreen(segments: ProgressSegment[]): boolean {
  return segments.length > 0 && segments.every(s => s === 1);
}

export function shouldTrackKamehamehaCompletion(wasAllGreen: boolean, nextAllGreen: boolean): boolean {
  return nextAllGreen && !wasAllGreen;
}

export function trackExerciseQuestion(exerciseId: string, correct: boolean): void {
  track('question', { exercise: exerciseId, correct });
}

export function trackExerciseKamehameha(exerciseId: string): void {
  track('kamehameha', { exercise: exerciseId });
}
