import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebugMode } from '../hooks/useDebugMode';
import { isDebugAnimationRequest } from '../utils/debugMode';
import { kamehamehaGifSrc, triggerKamehamehaCelebration } from '../utils/kamehamehaCelebration';

function KamehamehaCelebrationGif({ gifKey }: { gifKey: number }) {
  return (
    <img
      src={kamehamehaGifSrc(gifKey)}
      alt=""
      className="kamehameha-celebration-gif"
    />
  );
}

function playCelebration(setGifKey: (k: number) => void, setShow: (v: boolean) => void) {
  setGifKey(triggerKamehamehaCelebration());
  setShow(true);
}

export default function SessionProgressBar({
  segments,
  pulses,
  correct,
  incorrect,
  pct,
}: {
  segments: Array<0 | 1 | 2>;
  pulses?: number[];
  correct?: number;
  incorrect?: number;
  pct?: number;
}) {
  const debugMode = useDebugMode();
  const { search } = useLocation();
  const [showKamehameha, setShowKamehameha] = useState(false);
  const [kamehamehaKey, setKamehamehaKey] = useState(0);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!debugMode || !isDebugAnimationRequest(search)) return;
    playCelebration(setKamehamehaKey, setShowKamehameha);
  }, [debugMode, search]);

  useEffect(() => {
    if (segments.length > 0 && segments.every(s => s === 1)) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        playCelebration(setKamehamehaKey, setShowKamehameha);
      }
    } else if (segments.some(s => s !== 1)) {
      hasTriggeredRef.current = false;
    }
  }, [segments]);

  return (
    <div className="session-progress-row" aria-hidden="true" style={{ position: 'relative' }}>
      {showKamehameha && <KamehamehaCelebrationGif gifKey={kamehamehaKey} />}
      <div className="session-progress-left">
        {typeof correct === 'number' && typeof incorrect === 'number' && (
          <>
            <span className="score-correct">{correct}</span>
            <span> / </span>
            <span className="score-incorrect">{incorrect}</span>
          </>
        )}
      </div>
      <div className="session-progress" style={{ gridTemplateColumns: `repeat(${segments.length}, 1fr)` }}>
        {segments.map((s, i) => (
          <span
            key={`${i}-${pulses?.[i] ?? 0}`}
            className={`session-progress-cell ${s === 1 ? 'is-correct' : s === 2 ? 'is-incorrect' : ''}`}
          />
        ))}
      </div>
      <div className="session-progress-right">
        {typeof pct === 'number' && <span className="session-progress-percent">{pct}%</span>}
      </div>
    </div>
  );
}
