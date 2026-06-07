// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { trackUmamiEvent, trackUmamiPageview } from '../../src/utils/umami';

describe('umami', () => {
  const track = vi.fn();

  beforeEach(() => {
    track.mockClear();
    window.umami = { track };
  });

  afterEach(() => {
    window.umami = undefined;
  });

  it('tracks custom events', () => {
    trackUmamiEvent('question', { exercise: '/numbers', correct: true });
    expect(track).toHaveBeenCalledWith('question', { exercise: '/numbers', correct: true });
  });

  it('tracks pageviews with the current route', () => {
    trackUmamiPageview('/genki/08-3');
    expect(track).toHaveBeenCalledTimes(1);
    const updater = track.mock.calls[0][0];
    expect(typeof updater).toBe('function');
    expect(updater({ website: 'abc', title: 'Test' })).toEqual({
      website: 'abc',
      title: 'Test',
      url: '/genki/08-3',
    });
  });

  it('ignores calls when umami is unavailable', () => {
    window.umami = undefined;
    expect(() => {
      trackUmamiEvent('question', { exercise: '/time', correct: false });
      trackUmamiPageview('/time');
    }).not.toThrow();
  });
});
