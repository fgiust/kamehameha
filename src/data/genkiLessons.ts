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
import { genkiTxtLessons } from './genkiTxtLessons';

function parseGenkiId(id: string) {
  const match = /^genki(\d+)-(\d+)$/i.exec(id);
  if (!match) return null;
  return { lesson: Number(match[1]), exercise: Number(match[2]) };
}

function mergeGenkiLessons(legacy: TranslateSessionData[], txt: TranslateSessionData[]) {
  const byId = new Map<string, TranslateSessionData>();
  for (const item of legacy) byId.set(item.id, item);
  for (const item of txt) byId.set(item.id, item);

  const out: TranslateSessionData[] = [];
  for (const item of legacy) {
    const resolved = byId.get(item.id);
    if (!resolved) continue;
    out.push(resolved);
    byId.delete(item.id);
  }

  const remaining = Array.from(byId.values());
  remaining.sort((a, b) => {
    const pa = parseGenkiId(a.id);
    const pb = parseGenkiId(b.id);
    if (!pa || !pb) return a.id.localeCompare(b.id);
    return (pa.lesson - pb.lesson) || (pa.exercise - pb.exercise);
  });

  return [...out, ...remaining];
}

const legacyGenkiLessons: TranslateSessionData[] = [
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

export const genkiLessons: TranslateSessionData[] = mergeGenkiLessons(legacyGenkiLessons, genkiTxtLessons);

export function getGenkiLessonById(id: string): TranslateSessionData | undefined {
  return genkiLessons.find(l => l.id === id);
}
