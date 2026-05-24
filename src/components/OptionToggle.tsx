import React from 'react';

interface OptionToggleProps {
  label: string | React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
}

export default function OptionToggle({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ariaLabel,
  title,
}: OptionToggleProps) {
  return (
    <div
      className={`switch-item ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      title={title}
    >
      <span className="switch-text">{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={e => onChange(e.target.checked)}
        />
        <span className="slider" />
      </label>
    </div>
  );
}
