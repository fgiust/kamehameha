import { useEffect, useRef, useState } from 'react';

export type SubmitState = 'idle' | 'sending' | 'success' | 'error';

interface SubmitButtonProps {
  state: SubmitState;
  labels: {
    idle: string;
    sending: string;
    success: string;
    error: string;
  };
  disabled?: boolean;
  className?: string;
}

export default function SubmitButton({ state, labels, disabled, className = '' }: SubmitButtonProps) {
  const [displayState, setDisplayState] = useState<SubmitState>(state);
  const sendingStartTime = useRef<number>(0);

  useEffect(() => {
    if (state === 'sending') {
      sendingStartTime.current = Date.now();
      setDisplayState('sending');
    } else if (displayState === 'sending' && (state === 'success' || state === 'error')) {
      const elapsed = Date.now() - sendingStartTime.current;
      const minTime = 800; // Garantiamo che l'animazione sia visibile per almeno 800ms
      if (elapsed < minTime) {
        const timer = setTimeout(() => setDisplayState(state), minTime - elapsed);
        return () => clearTimeout(timer);
      } else {
        setDisplayState(state);
      }
    } else {
      setDisplayState(state);
    }
  }, [state, displayState]);

  const label = labels[displayState];
  const isPending = displayState === 'sending';

  return (
    <button
      type="submit"
      className={`animated-submit-btn ${displayState !== 'idle' ? `is-${displayState}` : ''} ${className}`}
      disabled={disabled || isPending}
    >
      <span className="btn-text">{label}</span>
      {isPending && <span className="btn-loader" />}
    </button>
  );
}