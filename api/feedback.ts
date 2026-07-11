import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendConfiguredTextEmail } from './_lib/resendEmail.js';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type FeedbackPayload = {
  section?: string;
  question?: string;
  correctAnswer?: string;
  userAnswer?: string;
  notes?: string;
  exerciseId?: string;
  userEmail?: string;
};

type VercelRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

type FeedbackRow = {
  id: number;
  entry_text: string;
  created_at: string;
  exported_at: string | null;
};

function formatTimestamp(date: Date) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function buildLogEntry(data: FeedbackPayload) {
  const timestamp = formatTimestamp(new Date());
  return `
========================================
[${timestamp}] FEEDBACK ENTRY
----------------------------------------
ID/URL:           ${data.exerciseId || 'N/A'}
Section/Exercise: ${data.section || 'N/A'}
User Email:       ${data.userEmail || 'N/A'}
Question:         ${data.question || 'N/A'}
Correct Answer:   ${data.correctAnswer || 'N/A'}
User Answer:      ${data.userAnswer || 'N/A'}
Notes/Issues:
${data.notes || 'N/A'}
========================================
`;
}

async function sendFeedbackNotificationEmail(data: FeedbackPayload, entryText: string) {
  const subjectParts = ['[kamehameha] New feedback'];
  if (data.section && data.section.trim().length > 0) {
    subjectParts.push(`- ${data.section.trim()}`);
  }

  const text = [
    'A new exercise feedback entry has been saved.',
    '',
    entryText.trim(),
    '',
    `Saved at: ${new Date().toISOString()}`,
  ].join('\n');

  await sendConfiguredTextEmail({
    subject: subjectParts.join(' '),
    text,
    replyTo: data.userEmail || undefined,
  });
}

function parseBool(raw: unknown) {
  if (typeof raw !== 'string') return false;
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function parseIntInRange(raw: unknown, fallback: number, min: number, max: number) {
  const n = typeof raw === 'string' ? Number(raw) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function firstQueryValue(req: VercelRequest, key: string) {
  const v = req.query?.[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

function buildDownloadFilename(date: Date) {
  try {
    const stamp = date
      .toLocaleString('sv-SE', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(' ', '-')
      .replace(':', '-');
    return `feedback.${stamp}.txt`;
  } catch {
    const iso = date.toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
    return `feedback.${iso}.txt`;
  }
}

function jsonOk(res: VercelResponse, obj: Record<string, JsonValue>) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function jsonError(res: VercelResponse, code: number, message: string) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: message }));
}

function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase feedback storage is not configured');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isSchemaMissingError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }) {
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

function describeFeedbackStorageError(error: unknown) {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: string; message?: string; details?: string | null; hint?: string | null };
    if (isSchemaMissingError(candidate)) {
      return 'Supabase feedback schema not initialized. Run "npm run db:migrate".';
    }
    if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
      return candidate.message;
    }
  }

  return error instanceof Error ? error.message : 'Unknown error';
}

async function handleExport(req: VercelRequest, res: VercelResponse) {
  const client = getSupabaseAdminClient();
  const requiredKey = process.env.FEEDBACK_EXPORT_KEY;
  if (requiredKey) {
    const key = firstQueryValue(req, 'key');
    if (key !== requiredKey) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not found');
      return;
    }
  }

  const limit = parseIntInRange(firstQueryValue(req, 'limit'), 1000, 1, 5000);
  const all = parseBool(firstQueryValue(req, 'all'));
  const mark = firstQueryValue(req, 'mark') === '0' ? false : true;

  let text = '';
  let totalCount = 0;
  let exportedCount = 0;

  const [totalResult, exportedResult] = await Promise.all([
    client
      .from('feedback_entries')
      .select('id', { count: 'exact', head: true }),
    client
      .from('feedback_entries')
      .select('id', { count: 'exact', head: true })
      .not('exported_at', 'is', null),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (exportedResult.error) throw exportedResult.error;

  totalCount = totalResult.count ?? 0;
  exportedCount = exportedResult.count ?? 0;

  if (all) {
    const { data, error } = await client
      .from('feedback_entries')
      .select('entry_text')
      .order('created_at', { ascending: true });
    if (error) throw error;
    text = (data ?? []).map(row => row.entry_text).join('');
  } else {
    const { data, error } = await client
      .from('feedback_entries')
      .select('id, entry_text, created_at, exported_at')
      .is('exported_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;

    const rows = (data ?? []) as FeedbackRow[];
    text = rows.map(row => row.entry_text).join('');

    if (mark && rows.length > 0) {
      const ids = rows.map(row => row.id);
      const { error: updateError } = await client
        .from('feedback_entries')
        .update({ exported_at: new Date().toISOString() })
        .in('id', ids);
      if (updateError) throw updateError;
      exportedCount += rows.length;
    }
  }

  const filename = buildDownloadFilename(new Date());
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-Feedback-Total', String(totalCount));
  res.setHeader('X-Feedback-Exported', String(exportedCount));
  res.end(text);
}

function parseBody(body: unknown): FeedbackPayload {
  if (body && typeof body === 'object') return body as FeedbackPayload;
  if (typeof body === 'string') return JSON.parse(body) as FeedbackPayload;
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    if (!parseBool(firstQueryValue(req, 'download'))) {
      jsonOk(res, { success: true });
      return;
    }
    await handleExport(req, res);
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST, GET');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
    return;
  }

  try {
    const client = getSupabaseAdminClient();
    const data = parseBody(req.body);
    const entry = buildLogEntry(data);
    const { error } = await client.from('feedback_entries').insert({
      exercise_id: data.exerciseId || null,
      section: data.section || null,
      question: data.question || null,
      correct_answer: data.correctAnswer || null,
      user_answer: data.userAnswer || null,
      user_email: data.userEmail || null,
      notes: data.notes || null,
      entry_text: entry,
    });
    if (error) throw error;

    try {
      await sendFeedbackNotificationEmail(data, entry);
    } catch (emailError) {
      console.error('Failed to send feedback notification email', emailError);
    }

    jsonOk(res, { success: true, message: 'Feedback saved successfully!' });
  } catch (err) {
    jsonError(res, 500, describeFeedbackStorageError(err));
  }
}
