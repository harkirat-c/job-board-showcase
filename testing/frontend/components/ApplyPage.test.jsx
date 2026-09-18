import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ApplyPage from '../../../src/components/applicants/ApplyPage.jsx';

function setupFetch() {
  global.fetch = jest.fn(async (url) => {
    const value = String(url);

    if (value.includes('/applicants/')) {
      return {
        ok: true,
        json: async () => ({ skills: ['React', 'Node'] }),
      };
    }

    return {
      ok: true,
      json: async () => ({}),
    };
  });
}

describe('ApplyPage', () => {
  afterEach(() => {
    localStorage.clear();
    global.fetch = undefined;
  });

  it('shows the application form for a job', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'app-1', role: 'applicant' }));
    setupFetch();

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/jobs/job-1/apply',
            state: {
              job: {
                _id: 'job-1',
                title: 'Frontend Developer',
                location: 'Saskatoon',
                description: 'Build user interfaces for the product.',
                payRange: { low: 25, high: 40 },
                skills: [],
                additionalQuestions: [],
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/jobs/:jobId/apply" element={<ApplyPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Frontend Developer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Application' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeInTheDocument();
  });
});
