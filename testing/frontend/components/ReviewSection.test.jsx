import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ReviewSection from '../../../src/components/ratings/ReviewSection.jsx';

class FakeEventSource {
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

describe('ReviewSection', () => {
  afterEach(() => {
    global.fetch = undefined;
    global.EventSource = undefined;
  });

  it('shows the employer review section', async () => {
    global.fetch = jest.fn(async (url) => {
      const value = String(url);

      if (value.includes('/employers/')) {
        return {
          ok: true,
          json: async () => ({ name: 'Acme Corp', description: 'Company description' }),
        };
      }

      if (value.includes('/ratings/employer/') && value.endsWith('/avg')) {
        return {
          ok: true,
          json: async () => ({ avgRating: 4.5 }),
        };
      }

      if (value.includes('/ratings/employer/')) {
        return {
          ok: true,
          json: async () => [],
        };
      }

      return { ok: true, json: async () => ({}) };
    });
    global.EventSource = FakeEventSource;

    render(<ReviewSection employerId="507f1f77bcf86cd799439011" />);

    expect(await screen.findByRole('heading', { name: 'About the Employer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
  });
});
