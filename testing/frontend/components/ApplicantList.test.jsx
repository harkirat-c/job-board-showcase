import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import ApplicantList from '../../../src/components/employers/ApplicationList.jsx';

class FakeEventSource {
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

describe('ApplicantList', () => {
  afterEach(() => {
    global.fetch = undefined;
    global.EventSource = undefined;
  });

  it('shows the applications page for a job with no applications', async () => {
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('/applications/read')) {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => [] };
    });
    global.EventSource = FakeEventSource;

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/jobs/employers/job-1/applications',
            state: { job: { _id: 'job-1', title: 'Frontend Developer' } },
          },
        ]}
      >
        <Routes>
          <Route path="/jobs/employers/:id/applications" element={<ApplicantList />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Applications for Frontend Developer' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No applications found for this job.')).toBeInTheDocument();
    });
  });
});
