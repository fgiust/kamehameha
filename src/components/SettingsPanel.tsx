import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n/index';
import { useDebugMode } from '../hooks/useDebugMode';
import { useSpeechSettings } from '../hooks/useSpeechSettings';

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 15.6 12 3.6 3.6 0 0 1 12 15.6z"
      />
    </svg>
  );
}

function SunIcon({ className = 'settings-theme-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        fill="none"
        d="M12 3v2.25M12 18.75V21M5.64 5.64l1.59 1.59M16.77 16.77l1.59 1.59M3 12h2.25M18.75 12H21M5.64 18.36l1.59-1.59M16.77 7.23l1.59-1.59"
      />
    </svg>
  );
}

function MoonIcon({ className = 'settings-theme-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5 6.25 6.25 0 0 1-8.5-8.5z"
      />
    </svg>
  );
}

function formatHintLines(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+/u).filter(line => line.trim().length > 0);
}

function InfoTip({ text }: { text: string }) {
  const lines = formatHintLines(text);

  return (
    <span className="settings-info-tip">
      <button
        type="button"
        className="settings-info-btn"
        aria-label={text}
        onClick={e => e.stopPropagation()}
      >
        i
      </button>
      <span className="settings-info-callout" role="tooltip">
        {lines.map((line, index) => (
          <span key={index} className="settings-info-callout-line">
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}

function SettingsToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`settings-row settings-row--toggle ${disabled ? 'is-disabled' : ''}`}>
      <div className="settings-row-label-group">
        <span className="settings-row-label">{label}</span>
        <InfoTip text={hint} />
      </div>
      <div className="settings-row-control">
        <label className="switch">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-label={label}
            onChange={e => onChange(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const debugMode = useDebugMode();
  const { speechEnabled, speechUseKanji, setSpeechEnabled, setSpeechUseKanji } = useSpeechSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') !== 'light';
    } catch {
      return true;
    }
  });

  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      /* noop */
    }
  }, [dark]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  return (
    <div className="settings-panel-container" onClick={e => e.stopPropagation()}>
      <button
        className="settings-toggle"
        onClick={() => setIsOpen(open => !open)}
        title={t('settings.options')}
        aria-label={t('settings.options')}
        aria-expanded={isOpen}
      >
        <GearIcon />
      </button>
      {isOpen && (
        <div className="settings-panel" role="dialog" aria-label={t('settings.options')}>
          <div className="settings-row">
            <span className="settings-row-label">{t('settings.language')}</span>
            <div className="settings-lang-switch" role="radiogroup" aria-label={t('settings.language')}>
              {(['en', 'it'] as const).map(code => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={lang === code}
                  className={`settings-lang-option ${lang === code ? 'is-active' : ''}`}
                  onClick={() => {
                    void setAppLanguage(code);
                  }}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-row-label">{t('settings.theme')}</span>
            <div className="settings-row-control">
              <button
                type="button"
                role="switch"
                aria-checked={dark}
                aria-label={t('common.toggleDarkMode')}
                className={`settings-theme-toggle ${dark ? 'is-dark' : 'is-light'}`}
                onClick={() => setDark(value => !value)}
              >
                <span className="settings-theme-slot settings-theme-slot--sun" aria-hidden="true">
                  <SunIcon />
                </span>
                <span className="settings-theme-slot settings-theme-slot--moon" aria-hidden="true">
                  <MoonIcon />
                </span>
                <span className="settings-theme-thumb" aria-hidden="true" />
              </button>
            </div>
          </div>

          {debugMode && (
            <div className="settings-section settings-section-debug">
              <div className="settings-section-title">{t('settings.speechSection')}</div>
              <SettingsToggleRow
                label={t('settings.speechEnabled')}
                hint={t('settings.speechEnabledHint')}
                checked={speechEnabled}
                onChange={setSpeechEnabled}
              />
              <SettingsToggleRow
                label={t('settings.speechUseKanji')}
                hint={t('settings.speechUseKanjiHint')}
                checked={speechUseKanji}
                onChange={setSpeechUseKanji}
                disabled={!speechEnabled}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
