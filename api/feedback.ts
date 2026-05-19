import { kv } from '@vercel/kv';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type FeedbackPayload = {
  section?: string;
  question?: string;
  correctAnswer?: string;
  userAnswer?: string;
  notes?: string;
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

const FEEDBACK_LIST_KEY = 'kamehameha:feedback:v1';
const FEEDBACK_EXPORTED_COUNT_KEY = 'kamehameha:feedback:exportedCount:v1';

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
Section/Exercise: ${data.section || 'N/A'}
Question:         ${data.question || 'N/A'}
Correct Answer:   ${data.correctAnswer || 'N/A'}
User Answer:      ${data.userAnswer || 'N/A'}
Notes/Issues:
${data.notes || 'N/A'}
========================================
`;
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

async function handleExport(req: VercelRequest, res: VercelResponse) {
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

  if (all) {
    const entries = (await kv.lrange<string>(FEEDBACK_LIST_KEY, 0, -1)) || [];
    const ordered = Array.isArray(entries) ? [...entries].reverse() : [];
    text = ordered.filter(x => typeof x === 'string').join('');
    totalCount = Array.isArray(entries) ? entries.length : 0;
    const exportedRaw = await kv.get<number>(FEEDBACK_EXPORTED_COUNT_KEY);
    exportedCount = typeof exportedRaw === 'number' ? exportedRaw : 0;
  } else {
    const total = await kv.llen(FEEDBACK_LIST_KEY);
    totalCount = typeof total === 'number' ? total : 0;

    const exportedRaw = await kv.get<number>(FEEDBACK_EXPORTED_COUNT_KEY);
    exportedCount = typeof exportedRaw === 'number' ? exportedRaw : 0;
    if (exportedCount > totalCount) exportedCount = totalCount;

    const unexported = Math.max(0, totalCount - exportedCount);
    const batch = Math.min(limit, unexported);
    if (batch > 0) {
      const start = unexported - batch;
      const end = unexported - 1;
      const chunk = (await kv.lrange<string>(FEEDBACK_LIST_KEY, start, end)) || [];
      const ordered = Array.isArray(chunk) ? [...chunk].reverse() : [];
      text = ordered.filter(x => typeof x === 'string').join('');
      if (mark) {
        exportedCount += batch;
        await kv.set(FEEDBACK_EXPORTED_COUNT_KEY, exportedCount);
      }
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
    const data = parseBody(req.body);
    const entry = buildLogEntry(data);
    await kv.lpush(FEEDBACK_LIST_KEY, entry);
    jsonOk(res, { success: true, message: 'Feedback saved successfully!' });
  } catch (err) {
    jsonError(res, 500, err instanceof Error ? err.message : 'Unknown error');
  }
}

