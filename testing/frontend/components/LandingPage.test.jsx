import { describe, expect, it } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import LandingPage from '../../../src/components/LandingPage.jsx';

describe('LandingPage', () => {
  it('shows the main landing content', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Get that/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Exploring' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
  });
});
