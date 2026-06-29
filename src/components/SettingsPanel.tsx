import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserAvatarUrl, getUserDisplayName, useAuth } from '../auth/AuthProvider';
import { setAppLanguage } from '../i18n/index';
import { localizePath, stripLangPrefix } from '../seo/localizedPaths';
import { useSpeechSettings } from '../hooks/useSpeechSettings';
import SpeechTestModal from './SpeechTestModal';

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12.24 10.286v3.821h5.445c-.234 1.229-.938 2.27-2 2.971l3.232 2.507c1.883-1.734 2.966-4.286 2.966-7.321 0-.704-.063-1.381-.18-2.036z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.896 6.618-2.422l-3.232-2.507c-.896.6-2.043.958-3.386.958-2.606 0-4.815-1.76-5.605-4.126H3.054v2.592A9.997 9.997 0 0 0 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.395 13.903A5.996 5.996 0 0 1 6.082 12c0-.66.113-1.302.313-1.903V7.505H3.054A10 10 0 0 0 2 12c0 1.614.386 3.14 1.054 4.495z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.971c1.469 0 2.786.505 3.823 1.496l2.867-2.867C16.959 2.993 14.695 2 12 2a9.997 9.997 0 0 0-8.946 5.505l3.341 2.592C7.185 7.731 9.394 5.971 12 5.971z"
      />
    </svg>
  );
}

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  const initials = useMemo(() => {
    const parts = name.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
    return letters || '?';
  }, [name]);

  if (avatarUrl) {
    return <img className="settings-avatar-image" src={avatarUrl} alt="" referrerPolicy="no-referrer" />;
  }

  return <span className="settings-avatar-fallback" aria-hidden="true">{initials}</span>;
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
  const { speechEnabled, speechUseKanji, setSpeechEnabled, setSpeechUseKanji } = useSpeechSettings();
  const { isConfigured, isReady, user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [speechTestOpen, setSpeechTestOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') !== 'light';
    } catch {
      return true;
    }
  });

  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const displayName = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const nextPath = `${location.pathname}${location.search}`;

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

  const handleGoogleSignIn = async () => {
    setAuthErrorMessage(null);
    setAuthBusy(true);

    try {
      await signInWithGoogle(nextPath);
    } catch (error) {
      setAuthErrorMessage(error instanceof Error ? error.message : t('auth.genericError'));
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthErrorMessage(null);
    setAuthBusy(true);

    try {
      await signOut();
    } catch (error) {
      setAuthErrorMessage(error instanceof Error ? error.message : t('auth.genericError'));
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="settings-panel-container" onClick={e => e.stopPropagation()}>
      <button
        className="settings-toggle"
        onClick={() => setIsOpen(open => !open)}
        title={t('settings.options')}
        aria-label={t('settings.options')}
        aria-expanded={isOpen}
      >
        {isReady && user ? (
          <span className="settings-toggle-avatar">
            <UserAvatar name={displayName || user.email || '?'} avatarUrl={avatarUrl} />
          </span>
        ) : (
          <GearIcon />
        )}
      </button>
      {isOpen && (
        <div className="settings-panel" role="dialog" aria-label={t('settings.options')}>
          {isConfigured && (
            <div className="settings-section settings-section-auth">
              <div className="settings-section-title">
                {user ? t('auth.accountSection') : t('auth.loginSection')}
              </div>

              {!isReady ? (
                <div className="settings-auth-loading" aria-hidden="true" />
              ) : user ? (
                <>
                  <div className="settings-account-card">
                    <span className="settings-account-avatar">
                      <UserAvatar name={displayName || user.email || '?'} avatarUrl={avatarUrl} />
                    </span>
                    <div className="settings-account-identity">
                      <span className="settings-account-name">{displayName || t('auth.account')}</span>
                      {user.email ? <span className="settings-account-email">{user.email}</span> : null}
                    </div>
                  </div>
                  <div className="settings-account-actions">
                    <button
                      type="button"
                      className="settings-account-link"
                      onClick={handleSignOut}
                      disabled={authBusy}
                    >
                      {t('auth.signOut')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="settings-auth-providers">
                    <button
                      type="button"
                      className="settings-auth-provider-button"
                      onClick={handleGoogleSignIn}
                      disabled={authBusy}
                    >
                      <GoogleIcon />
                      <span>{t('auth.continueWithGoogle')}</span>
                    </button>
                  </div>
                  <p className="settings-auth-copy">{t('auth.syncDescription')}</p>
                </>
              )}

              {authErrorMessage ? <div className="settings-auth-error">{authErrorMessage}</div> : null}
            </div>
          )}

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
                    if (lang === code) return;
                    const internalPath = stripLangPrefix(location.pathname);
                    const nextPath = localizePath(internalPath, code) + location.search;
                    void setAppLanguage(code).then(() => {
                      navigate(nextPath, { replace: true });
                    });
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
            <button
              type="button"
              className="settings-speech-test-link"
              onClick={() => setSpeechTestOpen(true)}
            >
              {t('settings.speechTestLink')}
            </button>
          </div>
        </div>
      )}
      <SpeechTestModal isOpen={speechTestOpen} onClose={() => setSpeechTestOpen(false)} />
    </div>
  );
}
