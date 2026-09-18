import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ReviewList from '../../../src/components/ratings/ReviewList.jsx';

describe('ReviewList', () => {
  it('shows the empty state when there are no reviews', () => {
    render(<ReviewList reviews={[]} />);

    expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
    expect(screen.getByText('0 total')).toBeInTheDocument();
  });
});
