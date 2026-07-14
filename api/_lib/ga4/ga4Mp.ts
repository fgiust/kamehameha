import {
  ALLOWED_ANALYTICS_EVENTS,
  MAX_CLIENT_ID_LENGTH,
  MAX_PARAM_STRING_LENGTH,
  type AnalyticsEventName,
} from './ga4Constants.js';

export type AnalyticsEventParams = Record<string, string | number | boolean>;

export type AnalyticsClientPayload = {
  client_id: string;
  name: AnalyticsEventName;
  params?: AnalyticsEventParams;
};

export type Ga4MpEvent = {
  name: string;
  params?: AnalyticsEventParams;
};

export type Ga4MpBody = {
  client_id: string;
  events: Ga4MpEvent[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeParamValue(value: unknown): string | number | boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > MAX_PARAM_STRING_LENGTH) return null;
    return trimmed;
  }
  return null;
}

export function sanitizeAnalyticsParams(params: unknown): AnalyticsEventParams | undefined {
  if (!isPlainObject(params)) return undefined;

  const out: AnalyticsEventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) continue;
    const sanitized = sanitizeParamValue(value);
    if (sanitized !== null) out[key] = sanitized;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function parseAnalyticsClientPayload(body: unknown): AnalyticsClientPayload | null {
  if (!isPlainObject(body)) return null;

  const clientId = typeof body.client_id === 'string' ? body.client_id.trim() : '';
  if (!clientId || clientId.length > MAX_CLIENT_ID_LENGTH) return null;

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!ALLOWED_ANALYTICS_EVENTS.includes(name as AnalyticsEventName)) return null;

  const params = sanitizeAnalyticsParams(body.params);
  return { client_id: clientId, name: name as AnalyticsEventName, params };
}

export function buildGa4MpBody(payload: AnalyticsClientPayload): Ga4MpBody {
  return {
    client_id: payload.client_id,
    events: [{
      name: payload.name,
      ...(payload.params ? { params: payload.params } : {}),
    }],
  };
}

export function getClientIpFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0]?.trim() || undefined;
  if (Array.isArray(xff) && xff[0]) return xff[0].split(',')[0]?.trim() || undefined;

  const xri = headers['x-real-ip'];
  if (typeof xri === 'string') return xri.trim() || undefined;
  if (Array.isArray(xri) && xri[0]) return xri[0].trim() || undefined;

  return undefined;
}

export function getUserAgentFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const ua = headers['user-agent'];
  if (typeof ua === 'string') return ua.slice(0, 512);
  if (Array.isArray(ua) && ua[0]) return ua[0].slice(0, 512);
  return undefined;
}
