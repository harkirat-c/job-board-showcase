import { describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jobRoutes from '../../../server/routes/jobRoutes.js';

const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

function buildDb({ jobs = [], applications = [], applicants = [] } = {}) {
  const jobsCollection = {
    find: jest.fn((query = {}) => {
      if (query.employerId) {
        return {
          toArray: jest.fn().mockResolvedValue(jobs.filter((job) => job.employerId === query.employerId)),
        };
      }
      if (query.isClosed) {
        return {
          toArray: jest.fn().mockResolvedValue(jobs.filter((job) => job.isClosed !== true)),
        };
      }
      return { toArray: jest.fn().mockResolvedValue(jobs) };
    }),
    findOne: jest.fn(async (query) => {
      const id = query._id?.toString?.() || query._id;
      return jobs.find((job) => String(job._id) === String(id)) || null;
    }),
    insertOne: jest.fn(async (payload) => {
      const insertedId = `job-${jobs.length + 1}`;
      jobs.push({ _id: insertedId, ...payload });
      return { insertedId };
    }),
    updateOne: jest.fn(async () => ({ acknowledged: true, matchedCount: 1, modifiedCount: 1 })),
    deleteOne: jest.fn(async () => ({ acknowledged: true, deletedCount: 1 })),
  };

  const applicationsCollection = {
    find: jest.fn((query = {}) => {
      if (query.jobId) {
        return {
          toArray: jest.fn().mockResolvedValue(applications.filter((application) => String(application.jobId) === String(query.jobId))),
        };
      }
      return { toArray: jest.fn().mockResolvedValue(applications) };
    }),
  };

  const applicantsCollection = {
    findOne: jest.fn(async (query) => {
      const id = query._id?.toString?.() || query._id;
      return applicants.find((applicant) => String(applicant._id) === String(id)) || null;
    }),
  };

  return {
    collection: jest.fn((name) => {
      if (name === 'jobs') return jobsCollection;
      if (name === 'applications') return applicationsCollection;
      if (name === 'applicants') return applicantsCollection;
      throw new Error(`Unexpected collection ${name}`);
    }),
  };
}

describe('jobRoutes', () => {
  afterAll(() => {
    logSpy.mockRestore();
  });

  it('creates a valid job', async () => {
    const db = buildDb();
    const app = express();
    app.use(express.json());
    app.use('/jobs', jobRoutes(db));

    const response = await request(app).post('/jobs').send({
      title: 'Frontend Developer',
      description: 'Build and maintain user-facing web application features.',
      location: 'Saskatoon',
      payRange: { low: 25, high: 40 },
      skills: ['React', 'JavaScript'],
      employerId: '507f1f77bcf86cd799439011',
      additionalQuestions: ['Do you have React experience?'],
    });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Frontend Developer');
    expect(response.body.isClosed).toBe(false);
  });

  it('rejects an invalid job payload', async () => {
    const db = buildDb();
    const app = express();
    app.use(express.json());
    app.use('/jobs', jobRoutes(db));

    const response = await request(app).post('/jobs').send({ title: 'Nope' });

    expect(response.status).toBe(400);
  });

  it('returns jobs for an employer', async () => {
    const db = buildDb({
      jobs: [
        { _id: 'job-1', employerId: '507f1f77bcf86cd799439011', title: 'Frontend', applicationInboxLastViewedAt: null },
      ],
      applications: [
        { jobId: 'job-1', submittedAt: '2026-04-10T00:00:00.000Z' },
      ],
    });
    const app = express();
    app.use(express.json());
    app.use('/jobs', jobRoutes(db));

    const response = await request(app).get('/jobs/employer/507f1f77bcf86cd799439011');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].unreadApplications).toBe(1);
  });
});
