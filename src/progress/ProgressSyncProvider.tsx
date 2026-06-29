import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  listPersistedSessionProgressRecords,
  readPersistedSessionProgressRecord,
  SESSION_PROGRESS_UPDATED_EVENT,
  notifySessionProgressUpdated,
  writePersistedSessionProgressRecord,
} from '../hooks/useSessionProgress';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import {
  describeCloudProgressSyncError,
  fetchCloudProgressRows,
  flushAllCloudProgressSync,
  getCloudProgressSyncDebugState,
  queueCloudProgressSync,
  setCloudProgressOnlineStatus,
  setCloudProgressSyncLastError,
  setCloudProgressSyncTarget,
  subscribeCloudProgressSyncDebugState,
  upsertCloudProgressRows,
  upsertProfileRow,
  type CloudProgressSyncDebugState,
  type CloudExerciseProgressRow,
} from './cloudProgressSync';

function toCloudRow(userId: string, record: ReturnType<typeof listPersistedSessionProgressRecords>[number]): CloudExerciseProgressRow {
  return {
    user_id: userId,
    persist_key: record.persistKey,
    segments: [...record.segments],
    total_segments: record.total,
    updated_at: new Date(record.at ?? Date.now()).toISOString(),
  };
}

type BootstrapPhase = 'idle' | 'syncing' | 'ready' | 'offline' | 'error';

export type ProgressSyncDebugInfo = {
  enabled: boolean;
  online: boolean;
  queuePendingCount: number;
  inFlightCount: number;
  lastPushAt: number | null;
  lastQueuedAt: number | null;
  lastError: string | null;
  bootstrapPhase: BootstrapPhase;
  lastBootstrapAt: number | null;
  importedMissingCount: number;
  uploadedLocalNewerCount: number;
  totalRemoteCount: number;
};

const defaultDebugInfo: ProgressSyncDebugInfo = {
  enabled: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  queuePendingCount: 0,
  inFlightCount: 0,
  lastPushAt: null,
  lastQueuedAt: null,
  lastError: null,
  bootstrapPhase: 'idle',
  lastBootstrapAt: null,
  importedMissingCount: 0,
  uploadedLocalNewerCount: 0,
  totalRemoteCount: 0,
};

const ProgressSyncDebugContext = createContext<ProgressSyncDebugInfo>(defaultDebugInfo);

export function ProgressSyncProvider({ children }: { children: ReactNode }) {
  const { isConfigured, isReady, user } = useAuth();
  const [resyncNonce, setResyncNonce] = useState(0);
  const [cloudDebug, setCloudDebug] = useState<CloudProgressSyncDebugState>(() => getCloudProgressSyncDebugState());
  const [bootstrapState, setBootstrapState] = useState<Omit<ProgressSyncDebugInfo, 'enabled' | 'online' | 'queuePendingCount' | 'inFlightCount' | 'lastPushAt' | 'lastQueuedAt' | 'lastError'>>({
    bootstrapPhase: 'idle',
    lastBootstrapAt: null,
    importedMissingCount: 0,
    uploadedLocalNewerCount: 0,
    totalRemoteCount: 0,
  });

  useEffect(() => {
    return subscribeCloudProgressSyncDebugState(setCloudDebug);
  }, []);

  useEffect(() => {
    const updateOnlineState = () => {
      const online = typeof navigator === 'undefined' ? true : navigator.onLine;
      setCloudProgressOnlineStatus(online);
      if (online) {
        setResyncNonce(value => value + 1);
      }
    };

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!isConfigured || !isReady || !user || !client) {
      setCloudProgressSyncTarget(null);
      return;
    }

    setCloudProgressSyncTarget({ client, userId: user.id });
  }, [isConfigured, isReady, user]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!isConfigured || !isReady || !user || !client) {
      setCloudProgressSyncLastError(null);
      setBootstrapState({
        bootstrapPhase: 'idle',
        lastBootstrapAt: null,
        importedMissingCount: 0,
        uploadedLocalNewerCount: 0,
        totalRemoteCount: 0,
      });
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setCloudProgressSyncLastError(null);
      setBootstrapState({
        bootstrapPhase: 'offline',
        lastBootstrapAt: null,
        importedMissingCount: 0,
        uploadedLocalNewerCount: 0,
        totalRemoteCount: 0,
      });
      return;
    }

    let isActive = true;

    void (async () => {
      setBootstrapState(prev => ({
        ...prev,
        bootstrapPhase: 'syncing',
      }));
      setCloudProgressSyncLastError(null);

      try {
        await upsertProfileRow(client, user);
        if (!isActive) return;

        const remoteRows = await fetchCloudProgressRows(client, user.id);
        if (!isActive) return;

        const localRecords = listPersistedSessionProgressRecords();
        const remoteByPersistKey = new Map(remoteRows.map(row => [row.persist_key, row]));
        const rowsToUpload: CloudExerciseProgressRow[] = [];
        let importedMissingCount = 0;
        let uploadedLocalNewerCount = 0;

        for (const record of localRecords) {
          const remote = remoteByPersistKey.get(record.persistKey);
          if (!remote) {
            rowsToUpload.push(toCloudRow(user.id, record));
            importedMissingCount += 1;
            continue;
          }

          const remoteAt = Date.parse(remote.updated_at);
          const localAt = record.at ?? 0;
          const normalizedRemoteAt = Number.isFinite(remoteAt) ? remoteAt : 0;
          if (localAt > normalizedRemoteAt) {
            rowsToUpload.push(toCloudRow(user.id, record));
            uploadedLocalNewerCount += 1;
          }
        }

        if (rowsToUpload.length > 0) {
          await upsertCloudProgressRows(client, rowsToUpload);
          if (!isActive) return;
          for (const row of rowsToUpload) {
            remoteByPersistKey.set(row.persist_key, row);
          }
        }

        for (const row of remoteByPersistKey.values()) {
          const updatedAt = Date.parse(row.updated_at);
          writePersistedSessionProgressRecord(
            row.persist_key,
            row.segments,
            Number.isFinite(updatedAt) ? updatedAt : Date.now(),
          );
        }

        notifySessionProgressUpdated();
        await flushAllCloudProgressSync();
        if (!isActive) return;

        setBootstrapState({
          bootstrapPhase: 'ready',
          lastBootstrapAt: Date.now(),
          importedMissingCount,
          uploadedLocalNewerCount,
          totalRemoteCount: remoteByPersistKey.size,
        });
      } catch (error) {
        if (!isActive) return;
        const described = describeCloudProgressSyncError(error);
        setCloudProgressSyncLastError(described.message);
        setBootstrapState({
          bootstrapPhase: 'error',
          lastBootstrapAt: Date.now(),
          importedMissingCount: 0,
          uploadedLocalNewerCount: 0,
          totalRemoteCount: 0,
        });
        // Leave local-only progress in place if cloud sync fails.
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isConfigured, isReady, user, resyncNonce]);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!isConfigured || !isReady || !user || !client) return;

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ persistKey?: string }>).detail;
      const persistKey = detail?.persistKey;
      if (!persistKey) return;

      const local = readPersistedSessionProgressRecord(persistKey);
      if (!local) return;

      queueCloudProgressSync(persistKey, local.segments);
    };

    window.addEventListener(SESSION_PROGRESS_UPDATED_EVENT, onUpdated as EventListener);
    return () => {
      window.removeEventListener(SESSION_PROGRESS_UPDATED_EVENT, onUpdated as EventListener);
    };
  }, [isConfigured, isReady, user]);

  const debugValue = useMemo<ProgressSyncDebugInfo>(() => ({
    enabled: Boolean(isConfigured && isReady && user),
    online: cloudDebug.online,
    queuePendingCount: cloudDebug.pendingCount,
    inFlightCount: cloudDebug.inFlightCount,
    lastPushAt: cloudDebug.lastFlushAt,
    lastQueuedAt: cloudDebug.lastQueuedAt,
    lastError: cloudDebug.lastError,
    bootstrapPhase: bootstrapState.bootstrapPhase,
    lastBootstrapAt: bootstrapState.lastBootstrapAt,
    importedMissingCount: bootstrapState.importedMissingCount,
    uploadedLocalNewerCount: bootstrapState.uploadedLocalNewerCount,
    totalRemoteCount: bootstrapState.totalRemoteCount,
  }), [bootstrapState, cloudDebug, isConfigured, isReady, user]);

  return (
    <ProgressSyncDebugContext.Provider value={debugValue}>
      {children}
    </ProgressSyncDebugContext.Provider>
  );
}

export function useProgressSyncDebug() {
  return useContext(ProgressSyncDebugContext);
}
