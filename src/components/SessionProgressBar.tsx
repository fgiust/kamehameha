import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebugMode } from '../hooks/useDebugMode';
import { isDebugAnimationRequest } from '../utils/debugMode';
import { triggerKamehamehaCelebration } from '../utils/kamehamehaCelebration';

function KamehamehaCelebrationGif({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className="kamehameha-celebration-gif"
    />
  );
}

function playCelebration(setGifSrc: (src: string) => void, setShow: (v: boolean) => void) {
  void triggerKamehamehaCelebration().then(({ gifSrc }) => {
    setGifSrc(gifSrc);
    setShow(true);
  });
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
  const [gifSrc, setGifSrc] = useState<string | null>(null);
  const isInitialMountRef = useRef(true);
  const wasAllGreenRef = useRef(false);

  useEffect(() => {
    if (!debugMode || !isDebugAnimationRequest(search)) return;
    playCelebration(setGifSrc, setShowKamehameha);
  }, [debugMode, search]);

  useEffect(() => {
    const allGreen = segments.length > 0 && segments.every(s => s === 1);

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      wasAllGreenRef.current = allGreen;
      return;
    }

    if (allGreen && !wasAllGreenRef.current) {
      playCelebration(setGifSrc, setShowKamehameha);
    }
    wasAllGreenRef.current = allGreen;
  }, [segments]);

  return (
    <div className="session-progress-row" aria-hidden="true" style={{ position: 'relative' }}>
      {showKamehameha && gifSrc ? <KamehamehaCelebrationGif src={gifSrc} /> : null}
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
