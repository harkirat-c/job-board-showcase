import { describe, expect, it } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import JobForm from '../../../src/components/employers/JobForm.jsx';

describe('JobForm', () => {
  it('shows the create job form', () => {
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <JobForm />
      </MemoryRouter>
    );

    expect(screen.getByText('Create New Job')).toBeInTheDocument();
    expect(screen.getByLabelText('Job Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Job Description')).toBeInTheDocument();
    expect(screen.getByText('+ Add Additional Question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Job' })).toBeInTheDocument();
  });
});
