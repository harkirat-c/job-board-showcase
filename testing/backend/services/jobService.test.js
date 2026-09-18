import { describe, expect, it, jest } from '@jest/globals';
import jobService from '../../../server/services/jobService.js';

function buildDb({ jobs, applications, applicants }) {
  const jobsCollection = {
    find: jest.fn((query = {}) => {
      if (query.employerId) {
        const result = jobs.filter((job) => job.employerId === query.employerId);
        return { toArray: jest.fn().mockResolvedValue(result) };
      }
      if (query.isClosed) {
        const result = jobs.filter((job) => job.isClosed !== true);
        return { toArray: jest.fn().mockResolvedValue(result) };
      }
      return { toArray: jest.fn().mockResolvedValue(jobs) };
    }),
    findOne: jest.fn(async (query) => {
      if (query._id && typeof query._id.toString === 'function') {
        return jobs.find((job) => String(job._id) === query._id.toString()) || null;
      }
      return null;
    }),
    insertOne: jest.fn(async (payload) => {
      const insertedId = '507f191e810c19729de860e1';
      jobs.push({ _id: insertedId, ...payload });
      return { insertedId };
    }),
    updateOne: jest.fn(async (query, update) => {
      const id = query._id?.toString?.() || query._id;
      const job = jobs.find((j) => String(j._id) === String(id));
      if (job && update.$set) Object.assign(job, update.$set);
      return { acknowledged: true, matchedCount: job ? 1 : 0, modifiedCount: job ? 1 : 0 };
    }),
    deleteOne: jest.fn(),
  };

  const applicationsCollection = {
    find: jest.fn((query = {}) => {
      if (query.jobId) {
        return {
          toArray: jest.fn().mockResolvedValue(
            applications.filter((a) => String(a.jobId) === String(query.jobId))
          ),
        };
      }
      return { toArray: jest.fn().mockResolvedValue(applications) };
    }),
  };

  const applicantsCollection = {
    findOne: jest.fn(async (query) => {
      const id = query._id?.toString?.() || query._id;
      return applicants.find((a) => String(a._id) === String(id)) || null;
    }),
  };

  return {
    collection: jest.fn((name) => {
      if (name === 'jobs') return jobsCollection;
      if (name === 'applications') return applicationsCollection;
      if (name === 'applicants') return applicantsCollection;
      throw new Error(`Unexpected collection ${name}`);
    }),
    jobsCollection,
    applicationsCollection,
    applicantsCollection,
  };
}

describe('jobService', () => {
  it('create applies defaults before storing job', async () => {
    const db = buildDb({ jobs: [], applications: [], applicants: [] });
    const service = jobService(db);

    const created = await service.create({ title: 'Software Developer', employerId: '507f1f77bcf86cd799439011' });

    expect(created.isClosed).toBe(false);
    expect(created.applicationInboxLastViewedAt).toBeNull();
  });

  it('getByEmployerId computes unread application counts', async () => {
    const jobs = [
      {
        _id: 'job-1',
        employerId: '507f1f77bcf86cd799439011',
        title: 'Frontend',
        applicationInboxLastViewedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        _id: 'job-2',
        employerId: '507f1f77bcf86cd799439011',
        title: 'Backend',
        applicationInboxLastViewedAt: null,
      },
    ];
    const applications = [
      { jobId: 'job-1', submittedAt: '2026-01-01T09:00:00.000Z' },
      { jobId: 'job-1', submittedAt: '2026-01-01T11:00:00.000Z' },
      { jobId: 'job-2', submittedAt: '2026-01-01T08:00:00.000Z' },
    ];

    const db = buildDb({ jobs, applications, applicants: [] });
    const service = jobService(db);

    const result = await service.getByEmployerId('507f1f77bcf86cd799439011');

    expect(result).toHaveLength(2);
    expect(result.find((job) => job._id === 'job-1')?.unreadApplications).toBe(1);
    expect(result.find((job) => job._id === 'job-2')?.unreadApplications).toBe(1);
  });

  it('getRecommendationsForApplicant returns empty array for invalid id', async () => {
    const db = buildDb({ jobs: [], applications: [], applicants: [] });
    const service = jobService(db);

    const result = await service.getRecommendationsForApplicant('not-an-object-id');

    expect(result).toEqual([]);
  });
});
