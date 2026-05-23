import { useEffect, useState } from 'react';
import { isDebugModeEnabled } from '../utils/debugMode';

export function useDebugMode(): boolean {
  const [enabled, setEnabled] = useState(isDebugModeEnabled);

  useEffect(() => {
    const refresh = () => setEnabled(isDebugModeEnabled());
    window.addEventListener('nihongo-debug-mode-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('nihongo-debug-mode-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return enabled;
}
