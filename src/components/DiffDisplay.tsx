import React from 'react';
import type { DiffUnitOp } from '../engines/sentenceEngine';
import { plainCopyFromDiffOps } from '../utils/copyText';
import CopyablePlainText from './CopyablePlainText';

interface Props {
  ops: DiffUnitOp[];
  className?: string;
  style?: React.CSSProperties;
}

export default function DiffDisplay({ ops, className = '', style }: Props) {
  const nodes: React.ReactNode[] = [];

  for (const op of ops) {
    if (op.kind === 'extra') {
      nodes.push(
        <span key={`ext-${nodes.length}`} className="diff-char diff-deleted">
          {op.text}
        </span>,
      );
      continue;
    }

    const { unit, status } = op;

    if (unit.kind === 'plain') {
      nodes.push(
        <span
          key={`p-${nodes.length}`}
          className={`diff-char ${status === 'missing' ? 'diff-missing' : 'diff-correct'}`}
        >
          {unit.surface}
        </span>,
      );
      continue;
    }

    const kanjiClass =
      status === 'correct_kanji'
        ? 'diff-correct'
        : status === 'correct_kana'
          ? 'diff-kanji-kana'
          : 'diff-missing';
    const rtClass = status === 'missing' ? 'diff-missing' : 'diff-correct';

    nodes.push(
      <ruby key={`r-${nodes.length}`} className={kanjiClass}>
        {unit.surface}
        <rt className={rtClass}>{unit.reading}</rt>
      </ruby>,
    );
  }

  return (
    <CopyablePlainText
      plainText={plainCopyFromDiffOps(ops)}
      className={`diff-display ${className}`.trim()}
      style={style}
    >
      {nodes}
    </CopyablePlainText>
  );
}
