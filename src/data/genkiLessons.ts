import { TranslateSessionData } from '../types';
import { genkiTxtLessons } from './genkiTxtLessons';

export const genkiLessons: TranslateSessionData[] = genkiTxtLessons;

export function getGenkiLessonById(id: string): TranslateSessionData | undefined {
  return genkiLessons.find(l => l.id === id);
}
