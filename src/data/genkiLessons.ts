import { TranslateSessionData } from '../types';
import { genki01Lessons } from './genki01';
import { genki02Lessons } from './genki02';
import { genki03Lessons } from './genki03';
import { genki04Lessons } from './genki04';
import { genki05Lessons } from './genki05';
import { genki06Lessons } from './genki06';
import { genki07Lessons } from './genki07';
import { genki08Lessons } from './genki08';
import { genki09Lessons } from './genki09';
import { genki10Lessons } from './genki10';
import { genki11Lessons } from './genki11';
import { genki12Lessons } from './genki12';
import { genki13Lessons } from './genki13';
import { genki14Lessons } from './genki14';
import { genki15Lessons } from './genki15';
import { genki16Lessons } from './genki16';
import { genki17Lessons } from './genki17';
import { genki18Lessons } from './genki18';
import { genki19Lessons } from './genki19';
import { genki20Lessons } from './genki20';
import { genki21Lessons } from './genki21';
import { genki22Lessons } from './genki22';
import { genki23Lessons } from './genki23';

export const genkiLessons: TranslateSessionData[] = [
  ...genki01Lessons,
  ...genki02Lessons,
  ...genki03Lessons,
  ...genki04Lessons,
  ...genki05Lessons,
  ...genki06Lessons,
  ...genki07Lessons,
  ...genki08Lessons,
  ...genki09Lessons,
  ...genki10Lessons,
  ...genki11Lessons,
  ...genki12Lessons,
  ...genki13Lessons,
  ...genki14Lessons,
  ...genki15Lessons,
  ...genki16Lessons,
  ...genki17Lessons,
  ...genki18Lessons,
  ...genki19Lessons,
  ...genki20Lessons,
  ...genki21Lessons,
  ...genki22Lessons,
  ...genki23Lessons,
];

export function getGenkiLessonById(id: string): TranslateSessionData | undefined {
  return genkiLessons.find(l => l.id === id);
}
