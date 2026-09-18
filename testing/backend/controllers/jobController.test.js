import { describe, expect, it, jest } from '@jest/globals';
import jobController from '../../../server/controllers/jobController.js';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('jobController', () => {
  it('returns jobs by employer id', async () => {
    const service = {
      getByEmployerId: jest.fn().mockResolvedValue([{ _id: 'job-1' }]),
    };
    const controller = jobController(service);
    const res = mockRes();

    await controller.getByEmployerId({ params: { employerId: 'emp-1' } }, res);

    expect(service.getByEmployerId).toHaveBeenCalledWith('emp-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ _id: 'job-1' }]);
  });

  it('returns read marker info after marking applications as read', async () => {
    const service = {
      markApplicationsAsRead: jest.fn().mockResolvedValue({ applicationInboxLastViewedAt: '2026-04-10T00:00:00.000Z' }),
    };
    const controller = jobController(service);
    const res = mockRes();

    await controller.markApplicationsAsRead({ params: { id: 'job-1' } }, res);

    expect(service.markApplicationsAsRead).toHaveBeenCalledWith('job-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      jobId: 'job-1',
      applicationInboxLastViewedAt: '2026-04-10T00:00:00.000Z',
    });
  });
});
