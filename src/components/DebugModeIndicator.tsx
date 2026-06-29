import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebugMode } from '../hooks/useDebugMode';
import { useProgressSyncDebug } from '../progress/ProgressSyncProvider';
import bugIcon from '../assets/icon-bug.svg';

const DEBUG_PANEL_OPEN_STORAGE_KEY = 'nihongo.debugPanelOpen';

function formatDebugTime(value: number | null, locale: string) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function DebugMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="debug-panel-metric">
      <span className="debug-panel-metric-label">{label}</span>
      <span className="debug-panel-metric-value">{value}</span>
    </div>
  );
}

export default function DebugModeIndicator() {
  const { t, i18n } = useTranslation();
  const debugMode = useDebugMode();
  const progressSyncDebug = useProgressSyncDebug();
  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'it' ? 'it' : 'en';
  const locale = lang === 'it' ? 'it-IT' : 'en-US';
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem(DEBUG_PANEL_OPEN_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (debugMode) return;
    setIsOpen(false);
  }, [debugMode]);

  useEffect(() => {
    try {
      localStorage.setItem(DEBUG_PANEL_OPEN_STORAGE_KEY, isOpen ? '1' : '0');
    } catch {
      return;
    }
  }, [isOpen]);

  if (!debugMode) return null;

  return (
    <>
      <button
        type="button"
        className={`debug-mode-indicator ${isOpen ? 'is-active' : ''}`}
        title={isOpen ? t('common.debugPanelHide') : t('common.debugPanelShow')}
        aria-label={isOpen ? t('common.debugPanelHide') : t('common.debugPanelShow')}
        aria-pressed={isOpen}
        onClick={() => setIsOpen(open => !open)}
      >
        <img src={bugIcon} alt="" aria-hidden="true" className="debug-mode-indicator-icon" />
      </button>

      {isOpen ? (
        <aside className="debug-panel-strip" aria-label={t('common.debugPanelTitle')}>
          <div className="debug-panel-strip-header">
            <span className="debug-panel-strip-title">{t('common.debugPanelTitle')}</span>
            <span className="debug-panel-strip-status">
              {progressSyncDebug.online ? t('settings.syncDebugOnline') : t('settings.syncDebugOffline')}
            </span>
          </div>

          <div className="debug-panel-strip-body">
            <DebugMetric
              label={t('settings.syncDebugEnabled')}
              value={progressSyncDebug.enabled ? t('settings.syncDebugEnabledOn') : t('settings.syncDebugEnabledOff')}
            />
            <DebugMetric
              label={t('settings.syncDebugPhase')}
              value={t(`settings.syncDebugPhaseValues.${progressSyncDebug.bootstrapPhase}`)}
            />
            <DebugMetric
              label={t('settings.syncDebugPending')}
              value={String(progressSyncDebug.queuePendingCount)}
            />
            <DebugMetric
              label={t('settings.syncDebugInflight')}
              value={String(progressSyncDebug.inFlightCount)}
            />
            <DebugMetric
              label={t('settings.syncDebugRemote')}
              value={String(progressSyncDebug.totalRemoteCount)}
            />
            <DebugMetric
              label={t('settings.syncDebugImported')}
              value={String(progressSyncDebug.importedMissingCount)}
            />
            <DebugMetric
              label={t('settings.syncDebugUploadedNewer')}
              value={String(progressSyncDebug.uploadedLocalNewerCount)}
            />
            <DebugMetric
              label={t('settings.syncDebugLastPush')}
              value={formatDebugTime(progressSyncDebug.lastPushAt, locale)}
            />
            <DebugMetric
              label={t('settings.syncDebugLastBootstrap')}
              value={formatDebugTime(progressSyncDebug.lastBootstrapAt, locale)}
            />
          </div>

          {progressSyncDebug.lastError ? (
            <div className="debug-panel-strip-error">{progressSyncDebug.lastError}</div>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}
