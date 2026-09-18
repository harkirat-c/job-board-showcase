import { describe, expect, it, jest } from '@jest/globals';
import applicationService from '../../../server/services/applicationService.js';

function buildApplicationsCollection() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
}

describe('applicationService', () => {
  it('create normalizes submittedAt and createdAt when missing', async () => {
    const collection = buildApplicationsCollection();
    const insertedId = 'inserted-1';

    collection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: insertedId, jobId: 'job-1' });
    collection.insertOne.mockResolvedValue({ insertedId });

    const db = {
      collection: jest.fn((name) => {
        if (name === 'applications') return collection;
        if (name === 'jobs') return { findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) };
        if (name === 'applicants') return { findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012' }) };
        throw new Error(`Unexpected collection ${name}`);
      }),
    };

    const service = applicationService(db);
    await service.create({ jobId: '507f1f77bcf86cd799439011', applicantId: '507f1f77bcf86cd799439012' });

    const insertedPayload = collection.insertOne.mock.calls[0][0];
    expect(insertedPayload.jobId).toBe('507f1f77bcf86cd799439011');
    expect(insertedPayload.applicantId).toBe('507f1f77bcf86cd799439012');
    expect(typeof insertedPayload.submittedAt).toBe('string');
    expect(typeof insertedPayload.createdAt).toBe('string');
  });

  it('create preserves provided dates', async () => {
    const collection = buildApplicationsCollection();
    const insertedId = 'inserted-2';

    collection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: insertedId });
    collection.insertOne.mockResolvedValue({ insertedId });

    const db = {
      collection: jest.fn((name) => {
        if (name === 'applications') return collection;
        if (name === 'jobs') return { findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) };
        if (name === 'applicants') return { findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012' }) };
        throw new Error(`Unexpected collection ${name}`);
      }),
    };

    const service = applicationService(db);
    await service.create({
      jobId: '507f1f77bcf86cd799439011',
      applicantId: '507f1f77bcf86cd799439012',
      submittedAt: '2026-01-01T10:00:00.000Z',
      createdAt: '2026-01-01T11:00:00.000Z',
    });

    const insertedPayload = collection.insertOne.mock.calls[0][0];
    expect(insertedPayload.submittedAt).toBe('2026-01-01T10:00:00.000Z');
    expect(insertedPayload.createdAt).toBe('2026-01-01T11:00:00.000Z');
  });
});
