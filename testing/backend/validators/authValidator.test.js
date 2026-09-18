import { describe, expect, it } from '@jest/globals';
import { loginSchema } from '../../../server/validators/authValidator.js';

describe('authValidator', () => {
  it('accepts a valid login payload', () => {
    const payload = { email: 'user@test.com', password: 'secret' };
    const { error, value } = loginSchema.validate(payload);

    expect(error).toBeUndefined();
    expect(value).toEqual(payload);
  });

  it('rejects an invalid email', () => {
    const payload = { email: 'not-an-email', password: 'secret' };
    const { error } = loginSchema.validate(payload);

    expect(error).toBeDefined();
  });

  it('rejects missing password', () => {
    const payload = { email: 'user@test.com' };
    const { error } = loginSchema.validate(payload);

    expect(error).toBeDefined();
  });
});
