export {
  ALLOWED_ANALYTICS_EVENTS,
  GA_MEASUREMENT_ID,
  MAX_ANALYTICS_BODY_BYTES,
  MAX_CLIENT_ID_LENGTH,
  MAX_PARAM_STRING_LENGTH,
  type AnalyticsEventName,
} from './ga4Constants';

export {
  buildGa4MpBody,
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  parseAnalyticsClientPayload,
  sanitizeAnalyticsParams,
  type AnalyticsClientPayload,
  type AnalyticsEventParams,
  type Ga4MpBody,
  type Ga4MpEvent,
} from './ga4Mp';
