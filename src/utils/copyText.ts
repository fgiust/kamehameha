import type { DiffUnitOp } from '../engines/sentenceEngine';
import { stripRuby } from '../engines/sentenceEngine';
import { stripRubyTags } from './utils';

/** Plain text for copy: bracket ruby notation → kanji/kana surface only. */
export function plainCopyFromRubyNotation(text: string): string {
  return stripRuby(text);
}

/** Plain text for copy: HTML or bracket ruby → surface only (no furigana). */
export function plainCopyFromRubyHtml(text: string): string {
  return stripRubyTags(text);
}

/**
 * Plain text for copy from a sentence diff: ruby as surface[reading], user mistakes as __text__.
 */
export function plainCopyFromDiffOps(ops: DiffUnitOp[]): string {
  let out = '';
  for (const op of ops) {
    if (op.kind === 'extra') {
      out += `_${op.text}_`;
      continue;
    }
    const { unit } = op;
    if (unit.kind === 'plain') {
      out += unit.surface;
    } else {
      out += `${unit.surface}[${unit.reading}]`;
    }
  }
  return out;
}

export type PlainCopyMode = 'surface' | 'diff';

export function setClipboardPlainText(event: React.ClipboardEvent, text: string): void {
  event.preventDefault();
  event.clipboardData.setData('text/plain', text);
}

function detectCopyMode(container: HTMLElement): PlainCopyMode {
  return container.classList.contains('diff-display') ? 'diff' : 'surface';
}

function isFullContentSelected(container: HTMLElement, range: Range): boolean {
  const full = document.createRange();
  full.selectNodeContents(container);
  return (
    range.compareBoundaryPoints(Range.START_TO_START, full) <= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, full) >= 0
  );
}

function clampRangeToContainer(container: HTMLElement, range: Range): Range {
  const bounded = range.cloneRange();
  const containerRange = document.createRange();
  containerRange.selectNodeContents(container);
  if (bounded.compareBoundaryPoints(Range.START_TO_START, containerRange) < 0) {
    bounded.setStart(containerRange.startContainer, containerRange.startOffset);
  }
  if (bounded.compareBoundaryPoints(Range.END_TO_END, containerRange) > 0) {
    bounded.setEnd(containerRange.endContainer, containerRange.endOffset);
  }
  return bounded;
}

function nodeIntersectsRange(node: Node, range: Range): boolean {
  if (typeof range.intersectsNode === 'function') {
    try {
      return range.intersectsNode(node);
    } catch {
      return false;
    }
  }
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);
  return (
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0
  );
}

function isRangeFullyContained(outer: Range, inner: Range): boolean {
  return (
    outer.compareBoundaryPoints(Range.START_TO_START, inner) <= 0 &&
    outer.compareBoundaryPoints(Range.END_TO_END, inner) >= 0
  );
}

function isNodeFullySelected(node: Node, range: Range): boolean {
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);
  return isRangeFullyContained(range, nodeRange);
}

function getTextSlice(textNode: Text, range: Range): string {
  if (!nodeIntersectsRange(textNode, range)) return '';
  const len = textNode.textContent?.length ?? 0;
  const start = textNode === range.startContainer ? range.startOffset : 0;
  const end = textNode === range.endContainer ? range.endOffset : len;
  return textNode.textContent?.slice(start, end) ?? '';
}

function getElementTextInRange(el: HTMLElement, range: Range): string {
  let out = '';
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += getTextSlice(child as Text, range);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      out += getElementTextInRange(child as HTMLElement, range);
    }
  }
  return out;
}

function getRubySurface(ruby: HTMLElement): string {
  let surface = '';
  for (const child of ruby.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'RT') {
      break;
    }
    if (child.nodeType === Node.TEXT_NODE) {
      surface += child.textContent ?? '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      surface += (child as Element).textContent ?? '';
    }
  }
  return surface;
}

function getRubyReading(ruby: HTMLElement): string {
  const rt = ruby.querySelector('rt');
  return (rt?.textContent ?? '').replace(/\u00a0/g, '').trim();
}

function getRubySurfaceRange(ruby: HTMLElement): Range | null {
  const range = document.createRange();
  let started = false;
  for (const child of ruby.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'RT') {
      break;
    }
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child as Text;
      if (!started) {
        range.setStart(text, 0);
        started = true;
      }
      range.setEnd(text, text.textContent?.length ?? 0);
    }
  }
  return started ? range : null;
}

function formatRubyUnit(surface: string, reading: string, mode: PlainCopyMode): string {
  if (mode === 'diff' && reading.length > 0) {
    return `${surface}[${reading}]`;
  }
  return surface;
}

function formatWholeRuby(ruby: HTMLElement, range: Range, mode: PlainCopyMode): string | null {
  const surface = getRubySurface(ruby);
  const reading = getRubyReading(ruby);

  if (isNodeFullySelected(ruby, range)) {
    return formatRubyUnit(surface, reading, mode);
  }

  const surfaceRange = getRubySurfaceRange(ruby);
  if (surfaceRange && isRangeFullyContained(range, surfaceRange)) {
    return formatRubyUnit(surface, reading, mode);
  }

  return null;
}

export function plainCopyFromDomRange(
  container: HTMLElement,
  range: Range,
  mode: PlainCopyMode,
): string {
  const bounded = clampRangeToContainer(container, range);
  let out = '';

  const walk = (node: Node): void => {
    if (!nodeIntersectsRange(node, bounded)) return;

    if (node.nodeType === Node.TEXT_NODE) {
      out += getTextSlice(node as Text, bounded);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;

    if (el.tagName === 'RUBY') {
      const whole = formatWholeRuby(el, bounded, mode);
      if (whole !== null) {
        out += whole;
        return;
      }
    }

    if (mode === 'diff' && el.classList.contains('diff-deleted')) {
      const selected = getElementTextInRange(el, bounded);
      if (selected) out += `_${selected}_`;
      return;
    }

    if (mode === 'diff' && el.classList.contains('diff-char')) {
      out += getElementTextInRange(el, bounded);
      return;
    }

    for (const child of el.childNodes) {
      walk(child);
    }
  };

  for (const child of container.childNodes) {
    walk(child);
  }

  return out;
}

/** Full or partial plain copy from a rendered copyable element. */
export function resolveCopyPlainText(
  container: HTMLElement,
  fullPlainText: string,
  mode?: PlainCopyMode,
): string {
  const copyMode = mode ?? detectCopyMode(container);
  const selection = typeof window !== 'undefined' ? window.getSelection() : null;
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return fullPlainText;
  }

  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    return fullPlainText;
  }

  if (isFullContentSelected(container, range)) {
    return fullPlainText;
  }

  return plainCopyFromDomRange(container, range, copyMode);
}
