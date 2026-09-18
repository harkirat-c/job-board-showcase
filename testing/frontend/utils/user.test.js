import { afterEach, describe, expect, it } from '@jest/globals';
import {
  getCurrentUser,
  getUserRole,
  getUserDisplayName,
  getUserInitial,
} from '../../../src/utils/user.js';

function setLocalStorageValue(value) {
  const storage = {
    getItem: () => value,
  };
  Object.defineProperty(global, 'localStorage', {
    value: storage,
    configurable: true,
  });
}

describe('user utils', () => {
  afterEach(() => {
    delete global.localStorage;
  });

  it('getCurrentUser returns normalized user with id', () => {
    setLocalStorageValue(JSON.stringify({ _id: { $oid: 'abc123' }, email: 'user@test.com' }));

    expect(getCurrentUser()).toEqual({
      _id: { $oid: 'abc123' },
      email: 'user@test.com',
      id: { $oid: 'abc123' },
    });
  });

  it('getCurrentUser returns null when storage value is bad', () => {
    setLocalStorageValue('{bad-json');
    expect(getCurrentUser()).toBeNull();
  });

  it('getUserRole returns employer or applicant based on fields', () => {
    expect(getUserRole({ companyName: 'Acme' })).toBe('employer');
    expect(getUserRole({ firstName: 'Ava' })).toBe('applicant');
  });

  it('getUserDisplayName and getUserInitial use best available name', () => {
    const user = { name: { first: 'Ava', last: 'Smith' } };
    expect(getUserDisplayName(user)).toBe('Ava Smith');
    expect(getUserInitial(user)).toBe('A');
  });
});
