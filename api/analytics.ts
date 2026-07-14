import {
  GA_MEASUREMENT_ID,
  MAX_ANALYTICS_BODY_BYTES,
} from './_lib/ga4/ga4Constants.js';
import { isAnalyticsRateLimited } from './_lib/ga4/analyticsRateLimit.js';
import {
  buildGa4MpBody,
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  parseAnalyticsClientPayload,
} from './_lib/ga4/ga4Mp.js';

type VercelRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
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

function parseBody(body: unknown): unknown {
  if (body && typeof body === 'object') return body;
  if (typeof body === 'string') {
    if (body.length > MAX_ANALYTICS_BODY_BYTES) {
      throw new Error('Payload too large');
    }
    return JSON.parse(body) as unknown;
  }
  return null;
}

function getMeasurementConfig() {
  const measurementId = process.env.GA_MEASUREMENT_ID || GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_MEASUREMENT_API_SECRET;
  return { measurementId, apiSecret };
}

export async function forwardToGa4Mp(
  payload: ReturnType<typeof parseAnalyticsClientPayload> & object,
  options: {
    measurementId: string;
    apiSecret: string;
    clientIp?: string;
    userAgent?: string;
    fetchImpl?: typeof fetch;
  },
): Promise<Response> {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL('https://www.google-analytics.com/mp/collect');
  url.searchParams.set('measurement_id', options.measurementId);
  url.searchParams.set('api_secret', options.apiSecret);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.clientIp) headers['X-Forwarded-For'] = options.clientIp;
  if (options.userAgent) headers['User-Agent'] = options.userAgent;

  return fetchFn(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(buildGa4MpBody(payload)),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    json(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = parseBody(req.body);
    const payload = parseAnalyticsClientPayload(rawBody);
    if (!payload) {
      json(res, 400, { ok: false, error: 'Invalid payload' });
      return;
    }

    const { measurementId, apiSecret } = getMeasurementConfig();
    if (!apiSecret) {
      json(res, 503, { ok: false, error: 'Analytics not configured' });
      return;
    }

    const clientIp = getClientIpFromHeaders(req.headers ?? {});
    const userAgent = getUserAgentFromHeaders(req.headers ?? {});

    const rateLimitKey = clientIp ?? 'unknown';
    if (isAnalyticsRateLimited(rateLimitKey)) {
      json(res, 429, { ok: false, error: 'Too many requests' });
      return;
    }

    const gaResponse = await forwardToGa4Mp(payload, {
      measurementId,
      apiSecret,
      clientIp,
      userAgent,
    });

    if (!gaResponse.ok) {
      json(res, 502, { ok: false, error: 'Upstream analytics failed' });
      return;
    }

    res.statusCode = 204;
    res.end();
  } catch {
    json(res, 400, { ok: false, error: 'Invalid request' });
  }
}
