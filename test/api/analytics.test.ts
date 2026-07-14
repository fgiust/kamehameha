import { describe, expect, it, vi } from 'vitest';
import { parseAnalyticsClientPayload } from '../../src/analytics/ga4Mp';
import { forwardToGa4Mp } from '../../api/analytics';

describe('api/analytics forwardToGa4Mp', () => {
  it('forwards payload with client IP and user agent headers', async () => {
    const payload = parseAnalyticsClientPayload({
      client_id: 'client-1',
      name: 'page_view',
      params: { page_path: '/negativeform' },
    });
    expect(payload).not.toBeNull();

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    await forwardToGa4Mp(payload!, {
      measurementId: 'G-TEST',
      apiSecret: 'secret',
      clientIp: '203.0.113.10',
      userAgent: 'TestAgent/1.0',
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('measurement_id=G-TEST');
    expect(url).toContain('api_secret=secret');
    expect(init.headers).toMatchObject({
      'X-Forwarded-For': '203.0.113.10',
      'User-Agent': 'TestAgent/1.0',
    });
  });
});
