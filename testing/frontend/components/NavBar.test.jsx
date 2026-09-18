import { afterEach, describe, expect, it } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import NavBar from '../../../src/components/NavBar.jsx';

function renderNavBar() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  );
}

describe('NavBar', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('shows login when no user is stored', () => {
    renderNavBar();

    expect(screen.getByText('Get that Job')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows signed-in state for an applicant', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'app-1', name: 'Ava Smith', role: 'applicant' }));

    renderNavBar();

    expect(screen.getByText('Signed in as')).toBeInTheDocument();
    expect(screen.getByText('Ava Smith')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });
});
