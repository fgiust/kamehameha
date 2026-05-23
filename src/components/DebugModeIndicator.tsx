import { useTranslation } from 'react-i18next';
import { useDebugMode } from '../hooks/useDebugMode';
import bugIcon from '../assets/icon-bug.svg';

export default function DebugModeIndicator() {
  const { t } = useTranslation();
  const debugMode = useDebugMode();

  if (!debugMode) return null;

  return (
    <div
      className="debug-mode-indicator"
      title={t('common.debugModeHint')}
      aria-label={t('common.debugModeActive')}
      aria-live="polite"
    >
      <img src={bugIcon} alt="" aria-hidden="true" className="debug-mode-indicator-icon" />
    </div>
  );
}
