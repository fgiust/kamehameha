import React from 'react';
import { parseRubyUnits } from 'tenshindiff';
import { plainCopyFromRubyHtml, plainCopyFromRubyNotation } from '../utils/copyText';
import CopyablePlainText from './CopyablePlainText';

interface JapaneseTextProps {
  text: string;
  showFurigana: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function JapaneseText({ text, showFurigana, className = '', style }: JapaneseTextProps) {
  if (!text) return null;

  const plainCopy =
    text.includes('<ruby>') || text.includes('<rt>')
      ? plainCopyFromRubyHtml(text)
      : plainCopyFromRubyNotation(text);
  const japaneseClass = `is-japanese ${!showFurigana ? 'is-furigana-hidden' : ''} ${className}`.trim();

  if (text.includes('<ruby>') || text.includes('<rt>')) {
    return (
      <CopyablePlainText plainText={plainCopy} className={japaneseClass} style={style}>
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </CopyablePlainText>
    );
  }

  const units = parseRubyUnits(text);

  return (
    <CopyablePlainText
      plainText={plainCopy}
      className={japaneseClass}
      style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', ...style }}
    >
      {units.map((unit, i) => {
        if (unit.kind === 'ruby') {
          return (
            <ruby key={i}>
              {unit.surface}
              <rt>{unit.reading}</rt>
            </ruby>
          );
        }
        return (
          <ruby key={i}>
            {unit.surface}
            <rt aria-hidden="true">&nbsp;</rt>
          </ruby>
        );
      })}
    </CopyablePlainText>
  );
}
