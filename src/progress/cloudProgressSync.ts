import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProgressSegmentState } from '../hooks/useSessionProgress';

export type CloudExerciseProgressRow = {
  user_id: string;
  persist_key: string;
  segments: ProgressSegmentState[];
  total_segments: number;
  updated_at: string;
};

type CloudSyncTarget = {
  client: SupabaseClient;
  userId: string;
};

export type CloudProgressSyncDebugState = {
  online: boolean;
  hasTarget: boolean;
  pendingCount: number;
  inFlightCount: number;
  lastFlushAt: number | null;
  lastQueuedAt: number | null;
  lastError: string | null;
};

let activeTarget: CloudSyncTarget | null = null;
const queuedByPersistKey = new Map<string, CloudExerciseProgressRow>();
const inFlightKeys = new Set<string>();
const listeners = new Set<(state: CloudProgressSyncDebugState) => void>();
let isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
let lastFlushAt: number | null = null;
let lastQueuedAt: number | null = null;
let lastError: string | null = null;

type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function buildDebugState(): CloudProgressSyncDebugState {
  return {
    online: isOnline,
    hasTarget: activeTarget !== null,
    pendingCount: queuedByPersistKey.size,
    inFlightCount: inFlightKeys.size,
    lastFlushAt,
    lastQueuedAt,
    lastError,
  };
}

function emitDebugState() {
  const state = buildDebugState();
  for (const listener of listeners) listener(state);
}

function isSchemaMissingError(error: SupabaseLikeError) {
  const combined = [error.code, error.message, error.details, error.hint]
    .filter(value => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();

  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    combined.includes('relation does not exist') ||
    combined.includes('schema cache') ||
    combined.includes('could not find the table')
  );
}

export function describeCloudProgressSyncError(error: unknown) {
  const fallbackMessage = 'Cloud progress sync failed.';
  const candidate = error && typeof error === 'object' ? (error as SupabaseLikeError) : {};

  if (isSchemaMissingError(candidate)) {
    return {
      isSchemaMissing: true,
      message: 'Supabase schema not initialized. Run "npm run db:migrate" after linking the project.',
    };
  }

  if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
    return {
      isSchemaMissing: false,
      message: candidate.message,
    };
  }

  return {
    isSchemaMissing: false,
    message: fallbackMessage,
  };
}

function buildRow(
  userId: string,
  persistKey: string,
  segments: ProgressSegmentState[],
  updatedAt = new Date().toISOString(),
): CloudExerciseProgressRow {
  return {
    user_id: userId,
    persist_key: persistKey,
    segments,
    total_segments: segments.length,
    updated_at: updatedAt,
  };
}

async function flushPersistKey(persistKey: string) {
  if (inFlightKeys.has(persistKey)) return;
  if (!isOnline) {
    emitDebugState();
    return;
  }
  const target = activeTarget;
  const row = queuedByPersistKey.get(persistKey);
  if (!target || !row) return;

  inFlightKeys.add(persistKey);
  emitDebugState();
  try {
    const { error } = await target.client
      .from('exercise_progress')
      .upsert(row, { onConflict: 'user_id,persist_key' });

    if (error) {
      lastError = describeCloudProgressSyncError(error).message;
    } else {
      lastError = null;
      lastFlushAt = Date.now();
      const latest = queuedByPersistKey.get(persistKey);
      if (
        latest &&
        latest.updated_at === row.updated_at &&
        latest.user_id === row.user_id &&
        latest.persist_key === row.persist_key
      ) {
        queuedByPersistKey.delete(persistKey);
      }
    }
    emitDebugState();
  } catch (error) {
    lastError = describeCloudProgressSyncError(error).message;
    if (typeof navigator !== 'undefined') {
      isOnline = navigator.onLine;
    }
    // Keep the latest queued value for a future retry.
  } finally {
    inFlightKeys.delete(persistKey);
    emitDebugState();
    const latest = queuedByPersistKey.get(persistKey);
    if (latest && latest !== row && activeTarget?.userId === latest.user_id) {
      void flushPersistKey(persistKey);
    }
  }
}

export function setCloudProgressSyncTarget(target: CloudSyncTarget | null) {
  activeTarget = target;
  queuedByPersistKey.clear();
  inFlightKeys.clear();
  lastError = null;
  emitDebugState();
}

export function setCloudProgressSyncLastError(message: string | null) {
  lastError = message;
  emitDebugState();
}

export function queueCloudProgressSync(persistKey: string, segments: ProgressSegmentState[]) {
  const target = activeTarget;
  if (!target) return;

  lastQueuedAt = Date.now();
  queuedByPersistKey.set(
    persistKey,
    buildRow(target.userId, persistKey, [...segments], new Date().toISOString()),
  );
  emitDebugState();
  void flushPersistKey(persistKey);
}

export function setCloudProgressOnlineStatus(online: boolean) {
  isOnline = online;
  emitDebugState();
  if (online) {
    void flushAllCloudProgressSync();
  }
}

export async function flushAllCloudProgressSync() {
  if (!isOnline) return;
  const keys = [...queuedByPersistKey.keys()];
  await Promise.all(keys.map(key => flushPersistKey(key)));
}

export function getCloudProgressSyncDebugState() {
  return buildDebugState();
}

export function subscribeCloudProgressSyncDebugState(
  listener: (state: CloudProgressSyncDebugState) => void,
) {
  listeners.add(listener);
  listener(buildDebugState());
  return () => {
    listeners.delete(listener);
  };
}

export async function upsertProfileRow(client: SupabaseClient, user: User) {
  const metadata = user.user_metadata;
  const firstName =
    typeof metadata?.given_name === 'string' && metadata.given_name.trim().length > 0
      ? metadata.given_name
      : null;
  const lastName =
    typeof metadata?.family_name === 'string' && metadata.family_name.trim().length > 0
      ? metadata.family_name
      : null;
  const displayName =
    typeof metadata?.full_name === 'string' && metadata.full_name.trim().length > 0
      ? metadata.full_name
      : typeof metadata?.name === 'string' && metadata.name.trim().length > 0
        ? metadata.name
        : user.email ?? null;
  const avatarUrl =
    typeof metadata?.avatar_url === 'string' && metadata.avatar_url.trim().length > 0
      ? metadata.avatar_url
      : typeof metadata?.picture === 'string' && metadata.picture.trim().length > 0
        ? metadata.picture
        : null;

  const { error } = await client.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}

export async function fetchCloudProgressRows(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('exercise_progress')
    .select('user_id, persist_key, segments, total_segments, updated_at')
    .eq('user_id', userId);

  if (error) throw error;

  const rows = (data ?? []).flatMap((row): CloudExerciseProgressRow[] => {
    const segments = Array.isArray(row.segments)
      ? row.segments.filter(value => value === 0 || value === 1 || value === 2)
      : null;

    if (!segments) return [];

    const totalSegments =
      typeof row.total_segments === 'number' && Number.isFinite(row.total_segments)
        ? Math.max(0, Math.floor(row.total_segments))
        : segments.length;

    const normalized =
      segments.length > totalSegments
        ? segments.slice(0, totalSegments)
        : [...segments, ...(Array(totalSegments - segments.length).fill(0) as ProgressSegmentState[])];

    return [{
      user_id: row.user_id,
      persist_key: row.persist_key,
      segments: normalized as ProgressSegmentState[],
      total_segments: totalSegments,
      updated_at: row.updated_at,
    }];
  });

  return rows;
}

export async function upsertCloudProgressRows(client: SupabaseClient, rows: CloudExerciseProgressRow[]) {
  if (rows.length === 0) return;
  const { error } = await client.from('exercise_progress').upsert(rows, {
    onConflict: 'user_id,persist_key',
  });

  if (error) throw error;
}
