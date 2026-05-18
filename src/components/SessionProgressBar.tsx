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
  return (
    <div className="session-progress-row" aria-hidden="true">
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
