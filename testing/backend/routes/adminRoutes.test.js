import { describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import adminRoutes from '../../../server/routes/adminRoutes.js';

function buildDb({ applicants = [], employers = [], ratings = [], applications = [], jobs = [] } = {}) {
  const collections = {
    applicants,
    employers,
    ratings,
    applications,
    jobs,
  };

  return {
    collection: jest.fn((name) => ({
      find: jest.fn(() => ({
        toArray: jest.fn().mockResolvedValue(collections[name] || []),
      })),
    })),
  };
}

describe('adminRoutes', () => {
  it('blocks analytics for non-admin role', async () => {
    const db = buildDb();
    const app = express();
    app.use('/admin', adminRoutes(db));

    const res = await request(app).get('/admin/analytics');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Admin access required/i);
  });

  it('returns analytics summary for admin role with date filtering', async () => {
    const db = buildDb({
      applicants: [{ _id: '507f1f77bcf86cd799439011', createdAt: '2026-04-05T12:00:00.000Z' }],
      employers: [{ _id: '507f191e810c19729de860ea', createdAt: '2026-04-06T12:00:00.000Z' }],
      ratings: [{ _id: '507f191e810c19729de860eb', createdAt: '2026-04-07T12:00:00.000Z' }],
      applications: [{ _id: '507f191e810c19729de860ec', submittedAt: '2026-04-08T12:00:00.000Z' }],
      jobs: [{ _id: '507f191e810c19729de860ed', postedAt: '2026-04-09T12:00:00.000Z' }],
    });

    const app = express();
    app.use('/admin', adminRoutes(db));

    const res = await request(app)
      .get('/admin/analytics')
      .set('x-user-role', 'admin')
      .query({
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-10T23:59:59.999Z',
        groupBy: 'day',
      });

    expect(res.status).toBe(200);
    expect(res.body.summary.totalSignUps).toBe(2);
    expect(res.body.summary.reviews).toBe(1);
    expect(res.body.summary.applications).toBe(1);
    expect(res.body.summary.jobsPosted).toBe(1);
  });
});
