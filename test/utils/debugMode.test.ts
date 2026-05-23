import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DEBUG_MODE_STORAGE_KEY, isDebugModeEnabled, syncDebugModeFromSearch } from '../../src/utils/debugMode';

describe('debugMode', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => { store.clear(); },
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enables with ?debug=42', () => {
    syncDebugModeFromSearch('?debug=42');
    expect(isDebugModeEnabled()).toBe(true);
  });

  it('disables with ?debug=off', () => {
    localStorage.setItem(DEBUG_MODE_STORAGE_KEY, '1');
    syncDebugModeFromSearch('?debug=off');
    expect(isDebugModeEnabled()).toBe(false);
  });

  it('ignores unknown debug values', () => {
    localStorage.setItem(DEBUG_MODE_STORAGE_KEY, '1');
    syncDebugModeFromSearch('?debug=yes');
    expect(isDebugModeEnabled()).toBe(true);
  });
});
