import React from 'react';
import { setClipboardPlainText } from '../utils/copyText';

interface Props {
  plainText: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/** Overrides copy so clipboard gets plainText instead of visible ruby markup. */
export default function CopyablePlainText({ plainText, className = '', style, children }: Props) {
  const onCopy = (event: React.ClipboardEvent) => {
    setClipboardPlainText(event, plainText);
  };

  return (
    <span className={className} style={style} onCopy={onCopy}>
      {children}
    </span>
  );
}
