import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProfilePage from '../../../src/components/applicants/ProfilePage.jsx';

describe('ProfilePage', () => {
  afterEach(() => {
    localStorage.clear();
    global.fetch = undefined;
  });

  it('shows an applicant profile', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'app-1', role: 'applicant' }));
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        email: 'user@test.com',
        name: { first: 'Ava', last: 'Smith' },
        phone: '3065551234',
        location: 'Saskatoon',
        skills: ['React'],
        resume: '',
        profilePicture: '',
      }),
    }));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ava Smith' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
  });
});
