import { parseRubyUnits } from '../engines/sentenceEngine';

/** Renders bracket ruby notation (surface[reading]) with furigana above kanji. */
export default function AnswerTemplateRuby({ text }: { text: string }) {
  if (!text) return null;

  const units = parseRubyUnits(text);

  return (
    <>
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
    </>
  );
}
