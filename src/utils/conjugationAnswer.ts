import { matchesByRubyUnits, parseRubyUnits, type RubyUnit } from 'tenshindiff';

function isPlausibleConjugationStem(kanaStem: string, dictKana: string): boolean {
  if (kanaStem.length === 0) return false;
  if (dictKana.startsWith(kanaStem)) return true;
  if (kanaStem.length >= 1) {
    return dictKana.slice(0, kanaStem.length - 1) === kanaStem.slice(0, -1);
  }
  return false;
}

function buildRubyTemplateFromStem(units: RubyUnit[], stemReadingLen: number, suffix: string): string {
  let out = '';
  let consumed = 0;

  for (const unit of units) {
    if (consumed >= stemReadingLen) break;

    const remaining = stemReadingLen - consumed;
    if (unit.reading.length <= remaining) {
      if (unit.kind === 'ruby') {
        out += `${unit.surface}[${unit.reading}]`;
      } else {
        out += unit.surface;
      }
      consumed += unit.reading.length;
      continue;
    }

    if (unit.kind === 'plain') {
      out += unit.surface.slice(0, remaining);
      consumed += remaining;
      continue;
    }

    out += unit.surface;
    consumed += unit.reading.length;
  }

  return out + suffix;
}

export function buildKanjiAnswerTemplate(rubyDict: string, kanaAnswer: string): string | null {
  const units = parseRubyUnits(rubyDict);
  const dictKana = units.map(u => u.reading).join('');
  if (kanaAnswer === dictKana) return rubyDict;

  for (let stemLen = kanaAnswer.length; stemLen >= 1; stemLen--) {
    const kanaStem = kanaAnswer.slice(0, stemLen);
    if (!isPlausibleConjugationStem(kanaStem, dictKana)) continue;

    const suffix = kanaAnswer.slice(stemLen);
    const template = buildRubyTemplateFromStem(units, stemLen, suffix);
    if (matchesByRubyUnits(kanaAnswer, template)) return template;
  }

  return null;
}

export function matchesConjugationAnswer(user: string, rubyDict: string, kanaAnswers: string[]): boolean {
  const answers = kanaAnswers.filter(a => a !== '');
  for (const kanaAnswer of answers) {
    if (user === kanaAnswer) return true;

    const template = buildKanjiAnswerTemplate(rubyDict, kanaAnswer);
    if (template && matchesByRubyUnits(user, template)) return true;
  }
  return false;
}
