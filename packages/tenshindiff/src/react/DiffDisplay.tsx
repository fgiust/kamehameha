import type { CSSProperties } from 'react';
import type { DiffUnitOp } from '../types';
import { formatDiffPlainText } from '../plain';
import { renderDiffHtml } from '../render';

export type DiffDisplayProps = {
  ops: DiffUnitOp[];
  className?: string;
  style?: CSSProperties;
  /** When set, copy puts plain diff text on the clipboard */
  onCopy?: (plain: string, event: React.ClipboardEvent) => void;
};

export function DiffDisplay({ ops, className = '', style, onCopy }: DiffDisplayProps) {
  const plainText = formatDiffPlainText(ops);
  const html = renderDiffHtml(ops, { wrap: false });

  const handleCopy = onCopy
    ? (event: React.ClipboardEvent) => {
        onCopy(plainText, event);
      }
    : undefined;

  return (
    <span
      className={`diff-display ${className}`.trim()}
      style={style}
      onCopy={handleCopy}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
