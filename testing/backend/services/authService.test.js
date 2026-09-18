import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import authService from '../../../server/services/authService.js';

function buildDb({ admin = null, applicant = null, employer = null } = {}) {
  const adminsCollection = {
    findOne: jest.fn(async (query) => {
      if (query.email && admin?.email === query.email) return admin;
      return null;
    }),
  };

  const applicantsCollection = {
    findOne: jest.fn(async (query) => {
      if (query.email && applicant?.email === query.email) return applicant;
      return null;
    }),
  };

  const employersCollection = {
    findOne: jest.fn(async (query) => {
      if (query.email && employer?.email === query.email) return employer;
      return null;
    }),
  };

  return {
    collection: jest.fn((name) => {
      if (name === 'admins') return adminsCollection;
      if (name === 'applicants') return applicantsCollection;
      if (name === 'employers') return employersCollection;
      throw new Error(`Unexpected collection ${name}`);
    }),
    adminsCollection,
    applicantsCollection,
    employersCollection,
  };
}

describe('authService', () => {
  beforeEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
  });

  it('logs in admin from env credentials', async () => {
    const hashed = await bcrypt.hash('secret', 4);

    const db = buildDb({
      admin: {
        _id: { toString: () => 'admin-1' },
        name: 'Admin',
        email: 'admin@test.com',
        password: hashed,
      },
    });
    const service = authService(db);
    const result = await service.login({ email: 'admin@test.com', password: 'secret' });

    expect(result).toEqual({
      user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com' },
      role: 'admin',
    });
  });

  it('logs in applicant with mapped fields', async () => {
    const hashed = await bcrypt.hash('plain', 4);
    const applicant = {
      _id: { toString: () => 'applicant-id' },
      email: 'applicant@test.com',
      password: hashed,
      name: { first: 'Ava', last: 'Smith' },
      phone: '555-1212',
      skills: ['React'],
      profilePicture: 'avatar.png',
      location: 'Saskatoon',
    };

    const db = buildDb({ applicant });

    const service = authService(db);
    const result = await service.login({ email: 'applicant@test.com', password: 'plain' });

    expect(result).toEqual({
      user: {
        id: 'applicant-id',
        name: 'Ava Smith',
        email: 'applicant@test.com',
        phone: '555-1212',
        skills: ['React'],
        profilePicture: 'avatar.png',
        location: 'Saskatoon',
      },
      role: 'applicant',
    });
  });

  it('throws for incorrect password', async () => {
    const hashed = await bcrypt.hash('correct', 4);
    const applicant = {
      _id: { toString: () => 'id' },
      email: 'badpw@test.com',
      password: hashed,
      name: { first: 'Test', last: 'User' },
    };

    const db = buildDb({ applicant });

    const service = authService(db);

    await expect(service.login({ email: 'badpw@test.com', password: 'wrong' })).rejects.toThrow('Invalid email or password');
  });
});
