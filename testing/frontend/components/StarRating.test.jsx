import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import StarRating from '../../../src/components/StarRating.jsx';

describe('StarRating', () => {
  it('renders a read-only rating', () => {
    render(<StarRating value={4} readOnly showValue />);

    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument();
    expect(screen.getByText('4.0/5')).toBeInTheDocument();
  });
});
