import { describe, expect, it } from '@jest/globals';
import { formatPhoneNumber } from '../../../src/utils/phone.js';

describe('formatPhoneNumber', () => {
  it('returns empty string for empty input', () => {
    expect(formatPhoneNumber('')).toBe('');
    expect(formatPhoneNumber(null)).toBe('');
  });

  it('formats local numbers', () => {
    expect(formatPhoneNumber('3065551234')).toBe('(306) 555-1234');
  });

  it('formats partial local numbers', () => {
    expect(formatPhoneNumber('306')).toBe('(306');
    expect(formatPhoneNumber('306555')).toBe('(306) 555');
  });

  it('formats country code numbers', () => {
    expect(formatPhoneNumber('13065551234')).toBe('+1 (306) 555-1234');
  });
});
