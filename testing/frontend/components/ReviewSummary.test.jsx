import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ReviewSummary from '../../../src/components/ratings/ReviewSummary.jsx';

describe('ReviewSummary', () => {
  it('shows title and description', () => {
    render(
      <ReviewSummary
        title="Acme Corp"
        description="A helpful company with strong reviews."
        avatarAlt="Acme Corp"
      />
    );

    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument();
    expect(screen.getByText('A helpful company with strong reviews.')).toBeInTheDocument();
  });
});
