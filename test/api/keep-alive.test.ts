import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import handler, { isAuthorizedCronRequest, pingSupabase } from '../../api/keep-alive';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

type MockRes = {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

function createRes(): MockRes {
  return {
    statusCode: 0,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

function parsed(res: MockRes) {
  return JSON.parse(res.body ?? 'null') as unknown;
}

function mockSelectLimit(result: { data: unknown; error: { message: string } | null }) {
  const limit = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ select });
  vi.mocked(createClient).mockReturnValue({ from } as never);
  return { from, select, limit };
}

describe('isAuthorizedCronRequest', () => {
  it('rejects when CRON_SECRET is missing', () => {
    expect(
      isAuthorizedCronRequest({ headers: { authorization: 'Bearer secret' } }, undefined),
    ).toBe(false);
  });

  it('rejects a missing or mismatched bearer token', () => {
    expect(isAuthorizedCronRequest({ headers: {} }, 'secret')).toBe(false);
    expect(
      isAuthorizedCronRequest({ headers: { authorization: 'Bearer other' } }, 'secret'),
    ).toBe(false);
    expect(
      isAuthorizedCronRequest({ headers: { authorization: 'secret' } }, 'secret'),
    ).toBe(false);
  });

  it('accepts Authorization: Bearer ${CRON_SECRET}', () => {
    expect(
      isAuthorizedCronRequest({ headers: { authorization: 'Bearer secret' } }, 'secret'),
    ).toBe(true);
  });
});

describe('pingSupabase', () => {
  it('selects id from profiles with limit 1', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ select });

    await pingSupabase({ from } as never);

    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id');
    expect(limit).toHaveBeenCalledWith(1);
  });

  it('throws when PostgREST returns an error', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const select = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ select });

    await expect(pingSupabase({ from } as never)).rejects.toThrow('permission denied');
  });
});

describe('api/keep-alive handler', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'cron-test-secret');
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-test-key');
    vi.mocked(createClient).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 without a valid bearer token', async () => {
    const res = createRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(401);
    expect(parsed(res)).toEqual({ ok: false, error: 'Unauthorized' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns 401 when CRON_SECRET is unset', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const res = createRes();
    await handler(
      { method: 'GET', headers: { authorization: 'Bearer cron-test-secret' } },
      res,
    );
    expect(res.statusCode).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns 405 for non-GET methods', async () => {
    const res = createRes();
    await handler(
      { method: 'POST', headers: { authorization: 'Bearer cron-test-secret' } },
      res,
    );
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET');
    expect(parsed(res)).toEqual({ ok: false, error: 'Method not allowed' });
  });

  it('pings profiles and returns ok on an authorized GET', async () => {
    const { from, select, limit } = mockSelectLimit({ data: [], error: null });
    const res = createRes();

    await handler(
      { method: 'GET', headers: { authorization: 'Bearer cron-test-secret' } },
      res,
    );

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-test-key',
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id');
    expect(limit).toHaveBeenCalledWith(1);
    expect(res.statusCode).toBe(200);
    expect(parsed(res)).toEqual({ ok: true });
  });

  it('returns 500 when the database query fails', async () => {
    mockSelectLimit({ data: null, error: { message: 'connection refused' } });
    const res = createRes();

    await handler(
      { method: 'GET', headers: { authorization: 'Bearer cron-test-secret' } },
      res,
    );

    expect(res.statusCode).toBe(500);
    expect(parsed(res)).toEqual({ ok: false, error: 'connection refused' });
  });
});
