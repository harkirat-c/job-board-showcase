import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import JobDashboard from '../../../src/components/employers/JobDashboard.jsx';

class FakeEventSource {
  addEventListener() {}
  removeEventListener() {}
  close() {}
}

describe('JobDashboard', () => {
  afterEach(() => {
    localStorage.clear();
    global.fetch = undefined;
    global.EventSource = undefined;
  });

  it('shows the dashboard heading and create button', async () => {
    localStorage.setItem('user', JSON.stringify({ id: '507f1f77bcf86cd799439011', role: 'employer' }));
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }));
    global.EventSource = FakeEventSource;

    render(
      <MemoryRouter>
        <JobDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Employer Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Job' })).toBeInTheDocument();
  });
});
