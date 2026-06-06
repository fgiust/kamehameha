import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../i18n/index';
import { useDebugMode } from '../hooks/useDebugMode';
import { useSpeechSettings } from '../hooks/useSpeechSettings';
import OptionToggle from './OptionToggle';

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
          <div className="settings-section">
            <div className="settings-section-title">{t('settings.language')}</div>
            <div className="settings-lang-row">
              <button
                type="button"
                className={`settings-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => {
                  void setAppLanguage('en');
                }}
              >
                {t('common.english')}
              </button>
              <button
                type="button"
                className={`settings-lang-btn ${lang === 'it' ? 'active' : ''}`}
                onClick={() => {
                  void setAppLanguage('it');
                }}
              >
                {t('common.italian')}
              </button>
            </div>
          </div>

          <div className="settings-section">
            <OptionToggle
              label={t('settings.themeDark')}
              checked={dark}
              onChange={setDark}
              ariaLabel={t('common.toggleDarkMode')}
            />
          </div>

          {debugMode && (
            <div className="settings-section settings-section-debug">
              <div className="settings-section-title">{t('settings.speechSection')}</div>
              <OptionToggle
                label={t('settings.speechEnabled')}
                checked={speechEnabled}
                onChange={setSpeechEnabled}
              />
              <OptionToggle
                label={t('settings.speechUseKanji')}
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
