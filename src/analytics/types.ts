export const ALLOWED_ANALYTICS_EVENTS = ['page_view', 'question', 'kamehameha'] as const;

export type AnalyticsEventName = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

export type AnalyticsEventParams = Record<string, string | number | boolean>;
