export const GA_MEASUREMENT_ID = 'G-QEYQ7EPJXP';

export const ALLOWED_ANALYTICS_EVENTS = ['page_view', 'question', 'kamehameha'] as const;

export type AnalyticsEventName = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

export const MAX_ANALYTICS_BODY_BYTES = 8192;

export const MAX_CLIENT_ID_LENGTH = 64;

export const MAX_PARAM_STRING_LENGTH = 512;

/** Max analytics POSTs per IP per minute (best-effort, per serverless instance). */
export const ANALYTICS_RATE_LIMIT_PER_MINUTE = 120;
