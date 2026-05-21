import { useEffect, useState, useRef } from 'react';
import kamehamehaAudioUrl from '../assets/kamehameha.mp3';
import kamehamehaGifUrl from '../assets/kamehameha.gif';

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
  const [showKamehameha, setShowKamehameha] = useState(false);
  const [kamehamehaKey, setKamehamehaKey] = useState(0);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Check if we reached 100% correct
    if (segments.length > 0 && segments.every(s => s === 1)) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;

        // Play sound
        const audio = new Audio(kamehamehaAudioUrl);
        audio.play().catch(e => console.error('Audio play failed:', e));

        // Show gif
        setKamehamehaKey(Date.now());
        setShowKamehameha(true);

        // Hide gif after animation
        // setTimeout(() => {
        //   setShowKamehameha(false);
        // }, 3000);
      }
    } else {
      if (segments.some(s => s !== 1)) {
        hasTriggeredRef.current = false;
      }
    }
  }, [segments]);

  return (
    <div className="session-progress-row" aria-hidden="true" style={{ position: 'relative' }}>
      {(showKamehameha) && (
        <img
          src={`${kamehamehaGifUrl}?v=${kamehamehaKey}`}
          alt=""
          style={{
            position: 'absolute',
            left: -100,
            top: '-30px',
            transform: 'translateY(-50%)',
            height: '250px',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      )}
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
