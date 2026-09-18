import { describe, expect, it } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import RegisterForm from '../../../src/components/RegisterForm.jsx';

describe('RegisterForm', () => {
  it('shows applicant registration fields by default', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Create an Account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Applicant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Employer' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });
});
