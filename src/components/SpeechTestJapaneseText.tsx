import JapaneseText from './JapaneseText';
import { parseSpeechTestHighlightSegments } from '../utils/speechTestHighlight';

export default function SpeechTestJapaneseText({ text }: { text: string }) {
  const segments = parseSpeechTestHighlightSegments(text);

  return (
    <span className="speech-test-japanese is-japanese">
      {segments.map((segment, index) => {
        const content = (
          <JapaneseText key={index} text={segment.text} showFurigana className="speech-test-japanese-part" />
        );
        if (!segment.highlight) return content;
        return (
          <span key={index} className="speech-test-highlight">
            {content}
          </span>
        );
      })}
    </span>
  );
}
