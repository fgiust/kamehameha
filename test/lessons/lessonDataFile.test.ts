import { describe, expect, it } from 'vitest';
import {
  isEditableSentenceLesson,
  lessonIdToDataFile,
} from '../../src/lessons/lessonDataFile';

describe('lessonDataFile', () => {
  it('maps genki session ids to genki txt files', () => {
    expect(lessonIdToDataFile('genki16-4')).toBe('genki-16-4.txt');
    expect(lessonIdToDataFile('genki1-2')).toBe('genki-01-2.txt');
  });

  it('maps sentence session ids to sentence txt files', () => {
    expect(lessonIdToDataFile('sentence-obligation')).toBe('sentence-obligation.txt');
  });

  it('rejects unknown ids', () => {
    expect(lessonIdToDataFile('reading-foo')).toBeNull();
    expect(isEditableSentenceLesson(undefined)).toBe(false);
  });
});
