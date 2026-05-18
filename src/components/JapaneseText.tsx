import React from 'react';
import { parseRubyUnits } from '../engines/sentenceEngine';

interface JapaneseTextProps {
  text: string;
  showFurigana: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function JapaneseText({ text, showFurigana, className = '', style }: JapaneseTextProps) {
  if (!text) return null;

  if (text.includes('<ruby>') || text.includes('<rt>')) {
    return (
      <span 
        className={`is-japanese ${!showFurigana ? 'is-furigana-hidden' : ''} ${className}`} 
        style={style}
        dangerouslySetInnerHTML={{ __html: text }} 
      />
    );
  }

  const units = parseRubyUnits(text);

  return (
    <span 
      className={`is-japanese ${!showFurigana ? 'is-furigana-hidden' : ''} ${className}`}
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
    </span>
  );
}
