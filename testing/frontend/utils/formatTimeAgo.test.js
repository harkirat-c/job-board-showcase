import { describe, expect, it } from '@jest/globals';
import { formatTimeAgo } from '../../../src/utils/formatTimeAgo.js';

describe('formatTimeAgo', () => {
  it('returns empty string for missing input', () => {
    expect(formatTimeAgo()).toBe('');
    expect(formatTimeAgo(null)).toBe('');
  });

  it('returns empty string for invalid date input', () => {
    expect(formatTimeAgo('not-a-date')).toBe('');
  });

  it('formats relative time from ISO string', () => {
    const value = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = formatTimeAgo(value);
    expect(result).toContain('hour');
  });

  it('formats relative time from mongo style date object', () => {
    const value = { $date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
    const result = formatTimeAgo(value);
    expect(['tomorrow', 'in 1 day']).toContain(result);
  });
});
