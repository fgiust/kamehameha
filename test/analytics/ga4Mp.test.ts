import { describe, expect, it } from 'vitest';
import {
  buildGa4MpBody,
  getClientIpFromHeaders,
  parseAnalyticsClientPayload,
  sanitizeAnalyticsParams,
} from 'ga4-analytics';

describe('ga4Mp', () => {
  it('parses valid page_view payload', () => {
    expect(parseAnalyticsClientPayload({
      client_id: 'abc-123',
      name: 'page_view',
      params: {
        page_path: '/it/negativeform',
        page_location: 'https://kamehameha.fgiust.com/it/negativeform',
      },
    })).toEqual({
      client_id: 'abc-123',
      name: 'page_view',
      params: {
        page_path: '/it/negativeform',
        page_location: 'https://kamehameha.fgiust.com/it/negativeform',
      },
    });
  });

  it('rejects unknown events and invalid client ids', () => {
    expect(parseAnalyticsClientPayload({ client_id: '', name: 'page_view' })).toBeNull();
    expect(parseAnalyticsClientPayload({ client_id: 'x', name: 'unknown' })).toBeNull();
  });

  it('builds GA4 MP body', () => {
    const payload = parseAnalyticsClientPayload({
      client_id: 'client-1',
      name: 'question',
      params: { exercise: '/genki/08-3', correct: true },
    });
    expect(buildGa4MpBody(payload!)).toEqual({
      client_id: 'client-1',
      events: [{
        name: 'question',
        params: { exercise: '/genki/08-3', correct: true },
      }],
    });
  });

  it('extracts client IP from forwarded headers', () => {
    expect(getClientIpFromHeaders({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' })).toBe('203.0.113.1');
    expect(getClientIpFromHeaders({ 'x-real-ip': '198.51.100.2' })).toBe('198.51.100.2');
  });

  it('sanitizes param strings and drops invalid keys', () => {
    expect(sanitizeAnalyticsParams({
      page_path: '/time',
      'bad-key': 'x',
      too_long: 'a'.repeat(600),
    })).toEqual({ page_path: '/time' });
  });
});
