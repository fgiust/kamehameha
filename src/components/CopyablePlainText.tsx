import React, { useRef } from 'react';
import type { PlainCopyMode } from '../utils/copyText';
import { resolveCopyPlainText, setClipboardPlainText } from '../utils/copyText';

interface Props {
  plainText: string;
  /** When set, overrides auto-detect from `diff-display` class. */
  copyMode?: PlainCopyMode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/** Overrides copy so clipboard gets plain text (full or selected) instead of visible ruby markup. */
export default function CopyablePlainText({
  plainText,
  copyMode,
  className = '',
  style,
  children,
}: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);

  const onCopy = (event: React.ClipboardEvent) => {
    const root = rootRef.current;
    const text = root ? resolveCopyPlainText(root, plainText, copyMode) : plainText;
    setClipboardPlainText(event, text);
  };

  return (
    <span ref={rootRef} className={className} style={style} onCopy={onCopy}>
      {children}
    </span>
  );
}
