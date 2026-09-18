import { describe, expect, it } from '@jest/globals';
import { createJobSchema, updateJobSchema } from '../../../server/validators/jobValidator.js';

describe('jobValidator', () => {
  it('accepts a valid create job payload', () => {
    const payload = {
      title: 'Frontend Developer',
      description: 'Build and maintain user-facing web application features.',
      location: 'Saskatoon',
      payRange: { low: 25, high: 40 },
      skills: ['React', 'JavaScript'],
      employerId: '507f1f77bcf86cd799439011',
      additionalQuestions: ['Do you have React experience?'],
    };

    const { error, value } = createJobSchema.validate(payload);

    expect(error).toBeUndefined();
    expect(value).toEqual(payload);
  });

  it('rejects create job payload when required fields are missing', () => {
    const payload = {
      title: 'Frontend Developer',
      location: 'Saskatoon',
    };

    const { error } = createJobSchema.validate(payload, { abortEarly: false });

    expect(error).toBeDefined();
  });

  it('rejects create job payload with invalid pay range', () => {
    const payload = {
      title: 'Frontend Developer',
      description: 'Build and maintain user-facing web application features.',
      location: 'Saskatoon',
      payRange: { low: 50, high: 40 },
      skills: ['React', 'JavaScript'],
      employerId: '507f1f77bcf86cd799439011',
      additionalQuestions: ['Do you have React experience?'],
    };

    const { error } = createJobSchema.validate(payload);

    expect(error).toBeDefined();
  });

  it('accepts partial update payload', () => {
    const payload = {
      title: 'Updated Title',
      isClosed: true,
    };

    const { error, value } = updateJobSchema.validate(payload);

    expect(error).toBeUndefined();
    expect(value).toEqual(payload);
  });
});
