import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import JobListings from '../../../src/components/applicants/JobListings.jsx';

class FakeEventSource {
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

describe('JobListings', () => {
  afterEach(() => {
    localStorage.clear();
    global.fetch = undefined;
    global.EventSource = undefined;
  });

  it('shows the empty jobs state', async () => {
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('/jobs')) return { ok: true, json: async () => [] };
      if (String(url).includes('/employers')) return { ok: true, json: async () => [] };
      return { ok: true, json: async () => [] };
    });
    global.EventSource = FakeEventSource;

    render(
      <MemoryRouter>
        <JobListings />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Get Employed' })).toBeInTheDocument();
    expect(screen.getByText('No jobs match your search.')).toBeInTheDocument();
  });
});
