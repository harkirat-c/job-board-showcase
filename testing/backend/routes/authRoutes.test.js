import { describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import authRoutes from '../../../server/routes/authRoutes.js';

function buildDb({ admin = null, applicant = null, employer = null } = {}) {
  const adminsCollection = {
    findOne: jest.fn(async (query) => {
      if (admin && query.email === admin.email) return admin;
      return null;
    }),
  };

  const applicantsCollection = {
    findOne: jest.fn(async (query) => {
      if (applicant && query.email === applicant.email) return applicant;
      return null;
    }),
  };

  const employersCollection = {
    findOne: jest.fn(async (query) => {
      if (employer && query.email === employer.email) return employer;
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
  };
}

describe('authRoutes', () => {
  it('logs in a valid applicant', async () => {
    const hashed = await bcrypt.hash('secret', 4);
    const db = buildDb({
      applicant: {
        _id: { toString: () => 'app-1' },
        email: 'applicant@test.com',
        password: hashed,
        name: { first: 'Ava', last: 'Smith' },
      },
    });

    const app = express();
    app.use(express.json());
    app.use('/auth', authRoutes(db));

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'applicant@test.com', password: 'secret' });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('applicant');
    expect(response.body.user.id).toBe('app-1');
  });

  it('rejects an invalid login body', async () => {
    const db = buildDb();
    const app = express();
    app.use(express.json());
    app.use('/auth', authRoutes(db));

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'bad-email' });

    expect(response.status).toBe(400);
  });
});
