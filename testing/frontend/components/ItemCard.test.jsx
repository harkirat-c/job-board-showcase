import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ItemCard from '../../../src/components/admin/ItemCard.jsx';

describe('ItemCard', () => {
  it('renders a listing summary', () => {
    render(
      <ItemCard
        itemType="listing"
        item={{
          _id: 'job-1',
          title: 'Frontend Developer',
          location: 'Saskatoon',
          payRange: { low: 25, high: 40 },
          skills: ['React', 'JavaScript'],
          isClosed: true,
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Frontend Developer' })).toBeInTheDocument();
    expect(screen.getByText('Job Listing')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Listing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });
});
