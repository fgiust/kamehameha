import { stripRuby } from './ruby';

/** Parse answer template with {option1|option2} syntax into internal array format */
export function parseAnswerTemplate(template: string): (string | string[])[] {
  const parts: (string | string[])[] = [];
  let buffer = '';
  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === '{') {
      if (buffer.length > 0) {
        parts.push(buffer);
        buffer = '';
      }
      const closeIdx = template.indexOf('}', i);
      if (closeIdx === -1) {
        buffer += ch;
      } else {
        const content = template.slice(i + 1, closeIdx);
        parts.push(content.split('|'));
        i = closeIdx;
      }
    } else {
      buffer += ch;
    }
  }
  if (buffer.length > 0) {
    parts.push(buffer);
  }
  return parts;
}

/** Generate all valid answer combinations for a sentence */
export function generateAnswers(parts: (string | string[])[]): string[] {
  const resolvedParts = parts.map(p => {
    if (typeof p === 'string') return [p];
    return p;
  });

  let combos: string[][] = [[]];
  for (const partAlts of resolvedParts) {
    const newCombos: string[][] = [];
    for (const combo of combos) {
      for (const alt of partAlts) {
        newCombos.push([...combo, alt]);
      }
    }
    combos = newCombos;
  }

  return combos.map(c => c.join(''));
}

/** First-surface answer from a template (first {a|b} option, ruby readings stripped). */
export function primarySurfaceFromTemplate(template: string): string {
  const answers = generateAnswers(parseAnswerTemplate(template));
  return stripRuby(answers[0] ?? template);
}

export function pickBestAnswerForDisplay(answers: string[]): string {
  let best = answers[0] ?? '';
  let bestScore = -1;
  for (const a of answers) {
    const score = (a.match(/\[[^\]]*\]/g) ?? []).length;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}
