type Props = {
  text: string;
  label?: string;
  className?: string;
};

export default function AlternateLanguageLine({ text, label, className }: Props) {
  if (!text.trim()) return null;

  return (
    <div className={`alt-lang-line ${className ?? ''}`.trim()}>
      {label ? <span className="alt-lang-label">{label}</span> : null}
      <span>{text}</span>
    </div>
  );
}
