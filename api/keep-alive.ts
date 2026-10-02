import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type VercelRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

function json(res: VercelResponse, code: number, obj: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function headerValue(req: VercelRequest, name: string): string | undefined {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

export function isAuthorizedCronRequest(
  req: VercelRequest,
  cronSecret = process.env.CRON_SECRET,
): boolean {
  if (!cronSecret) return false;
  return headerValue(req, 'authorization') === `Bearer ${cronSecret}`;
}

function getSupabaseAnonClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error('Supabase is not configured');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function pingSupabase(
  client: Pick<SupabaseClient, 'from'> = getSupabaseAnonClient(),
): Promise<void> {
  // Harmless anon read: GRANT SELECT exists on profiles, RLS returns no rows
  // for the anonymous role. The request still reaches Postgres via PostgREST.
  const { error } = await client.from('profiles').select('id').limit(1);
  if (error) {
    throw new Error(error.message);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    json(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  if (!isAuthorizedCronRequest(req)) {
    json(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  try {
    await pingSupabase();
    json(res, 200, { ok: true });
  } catch (err) {
    json(res, 500, { ok: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
