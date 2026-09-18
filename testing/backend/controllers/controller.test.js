import { describe, expect, it, jest } from '@jest/globals';
import createController from '../../../server/controllers/controller.js';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('createController', () => {
  it('returns all items', async () => {
    const service = {
      getAll: jest.fn().mockResolvedValue([{ _id: '1' }]),
    };
    const controller = createController(service);
    const res = mockRes();

    await controller.getAll({}, res);

    expect(service.getAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ _id: '1' }]);
  });

  it('returns 404 when item is missing', async () => {
    const service = {
      getById: jest.fn().mockResolvedValue(null),
    };
    const controller = createController(service);
    const res = mockRes();

    await controller.getById({ params: { id: '1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('creates an item', async () => {
    const service = {
      create: jest.fn().mockResolvedValue({ _id: '1', name: 'Test' }),
    };
    const controller = createController(service);
    const res = mockRes();

    await controller.create({ body: { name: 'Test' } }, res);

    expect(service.create).toHaveBeenCalledWith({ name: 'Test' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ _id: '1', name: 'Test' });
  });
});
