import { findInvalidRubyNotations, formatInvalidRubyNotation } from './rubyNotation';

export type AnswerTemplateIssueCode =
  | 'unclosed-brace'
  | 'unclosed-bracket'
  | 'nested-brace'
  | 'nested-bracket'
  | 'brace-inside-bracket'
  | 'single-alternative'
  | 'missing-furigana'
  | 'invalid-ruby';

export type AnswerTemplateIssue = {
  code: AnswerTemplateIssueCode;
  message: string;
  index?: number;
};

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf々]/;

/** Validates Genki-style answer template syntax (braces, brackets, furigana). */
export function validateAnswerTemplate(text: string): AnswerTemplateIssue[] {
  const issues: AnswerTemplateIssue[] = [];
  issues.push(...validateBracketsAndBraces(text));
  issues.push(...validateFuriganaCoverage(text));
  for (const invalid of findInvalidRubyNotations(text)) {
    issues.push({
      code: 'invalid-ruby',
      message: formatInvalidRubyNotation(invalid),
      index: invalid.index,
    });
  }
  return issues;
}

function validateBracketsAndBraces(text: string): AnswerTemplateIssue[] {
  const issues: AnswerTemplateIssue[] = [];
  const braceStack: number[] = [];
  const bracketStack: number[] = [];

  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;

    if (ch === '[') {
      if (bracketStack.length > 0) {
        issues.push({
          code: 'nested-bracket',
          message: 'Nested square brackets are not allowed',
          index: i,
        });
      }
      bracketStack.push(i);
      i++;
      continue;
    }

    if (ch === ']') {
      if (bracketStack.length === 0) {
        issues.push({
          code: 'unclosed-bracket',
          message: 'Unmatched closing bracket ]',
          index: i,
        });
      } else {
        bracketStack.pop();
      }
      i++;
      continue;
    }

    if (ch === '{') {
      if (bracketStack.length > 0) {
        issues.push({
          code: 'brace-inside-bracket',
          message: 'Curly braces are not allowed inside square brackets',
          index: i,
        });
      }
      if (braceStack.length > 0) {
        issues.push({
          code: 'nested-brace',
          message: 'Nested curly braces are not allowed',
          index: i,
        });
      }
      const start = i;
      const closeIdx = text.indexOf('}', i + 1);
      if (closeIdx === -1) {
        issues.push({
          code: 'unclosed-brace',
          message: 'Unclosed curly brace {',
          index: i,
        });
        i++;
        continue;
      }
      const inner = text.slice(i + 1, closeIdx);
      if (!inner.includes('|')) {
        issues.push({
          code: 'single-alternative',
          message: 'Each {…} group must contain at least one | alternative separator',
          index: start,
        });
      }
      for (let j = i + 1; j < closeIdx; j++) {
        const innerCh = text[j]!;
        if (innerCh === '{') {
          issues.push({
            code: 'nested-brace',
            message: 'Nested curly braces are not allowed',
            index: j,
          });
        }
        if (innerCh === '[' && text.slice(i + 1, j).includes('[')) {
          const openBrackets = text.slice(i + 1, j).split('[').length - 1;
          const closeBrackets = text.slice(i + 1, j).split(']').length - 1;
          if (openBrackets > closeBrackets) {
            issues.push({
              code: 'nested-bracket',
              message: 'Nested square brackets are not allowed',
              index: j,
            });
          }
        }
      }
      braceStack.push(start);
      i = closeIdx + 1;
      braceStack.pop();
      continue;
    }

    if (ch === '}') {
      if (braceStack.length === 0) {
        issues.push({
          code: 'unclosed-brace',
          message: 'Unmatched closing brace }',
          index: i,
        });
      } else {
        braceStack.pop();
      }
      i++;
      continue;
    }

    i++;
  }

  for (const idx of braceStack) {
    issues.push({
      code: 'unclosed-brace',
      message: 'Unclosed curly brace {',
      index: idx,
    });
  }
  for (const idx of bracketStack) {
    issues.push({
      code: 'unclosed-bracket',
      message: 'Unclosed square bracket [',
      index: idx,
    });
  }

  return issues;
}

function validateFuriganaCoverage(text: string): AnswerTemplateIssue[] {
  const issues: AnswerTemplateIssue[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '{') {
      const closeIdx = text.indexOf('}', i + 1);
      if (closeIdx === -1) break;
      const inner = text.slice(i + 1, closeIdx);
      for (const alt of inner.split('|')) {
        validateFuriganaPlainText(alt, issues, i + 1);
      }
      i = closeIdx + 1;
      continue;
    }
    let j = i;
    while (j < text.length && text[j] !== '{') j++;
    validateFuriganaPlainText(text.slice(i, j), issues, i);
    i = j;
  }
  return issues;
}

const RUBY_WITH_KANJI_RE = /[^\[\]{}|]*[\u4e00-\u9faf\u3400-\u4dbf々][^\[\]{}|]*\[[^\]]*\]/g;

function validateFuriganaPlainText(text: string, issues: AnswerTemplateIssue[], baseIndex: number): void {
  let masked = text;
  RUBY_WITH_KANJI_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RUBY_WITH_KANJI_RE.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    masked =
      masked.slice(0, start) +
      ' '.repeat(end - start) +
      masked.slice(end);
  }

  for (let i = 0; i < masked.length; i++) {
    if (!KANJI_RE.test(masked[i]!)) continue;
    let runStart = i;
    while (i < masked.length && KANJI_RE.test(masked[i]!)) i++;
    const run = masked.slice(runStart, i);
    issues.push({
      code: 'missing-furigana',
      message: `Kanji without furigana: ${run}`,
      index: baseIndex + runStart,
    });
    i--;
  }
}

export function hasAnswerTemplateIssues(text: string): boolean {
  return validateAnswerTemplate(text).length > 0;
}
