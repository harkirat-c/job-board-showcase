import { describe, expect, it, jest } from '@jest/globals';
import { ObjectId } from 'mongodb';
import createService from '../../../server/services/service.js';

function buildCollection() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    insertOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
}

describe('createService', () => {
  it('getAll returns collection documents', async () => {
    const collection = buildCollection();
    const docs = [{ a: 1 }, { a: 2 }];
    collection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue(docs) });

    const service = createService(collection);
    const result = await service.getAll();

    expect(collection.find).toHaveBeenCalledWith({});
    expect(result).toEqual(docs);
  });

  it('create inserts and returns created resource', async () => {
    const collection = buildCollection();
    const insertedId = new ObjectId('507f191e810c19729de860ea');
    const payload = { email: 'a@b.com' };
    const created = { _id: insertedId, ...payload };

    collection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(created);
    collection.insertOne.mockResolvedValue({ insertedId });

    const service = createService(collection);
    const result = await service.create(payload, { email: payload.email });

    expect(collection.findOne).toHaveBeenNthCalledWith(1, { email: payload.email });
    expect(collection.insertOne).toHaveBeenCalledWith(payload);
    expect(collection.findOne).toHaveBeenNthCalledWith(2, { _id: insertedId });
    expect(result).toEqual(created);
  });

  it('create throws 409 when duplicate exists', async () => {
    const collection = buildCollection();
    collection.findOne.mockResolvedValue({ _id: 'existing' });
    const service = createService(collection);

    await expect(service.create({ email: 'x@y.com' }, { email: 'x@y.com' })).rejects.toMatchObject({
      message: 'Resource already exists',
      statusCode: 409,
    });

    expect(collection.insertOne).not.toHaveBeenCalled();
  });
});
