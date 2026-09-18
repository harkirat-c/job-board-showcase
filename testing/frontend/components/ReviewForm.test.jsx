import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ReviewForm from '../../../src/components/ratings/ReviewForm.jsx';

describe('ReviewForm', () => {
  it('shows the heading, textarea, and submit button', () => {
    render(
      <ReviewForm
        rating={4}
        comment="Great place to work"
        onRatingChange={() => {}}
        onCommentChange={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: 'Tell Us About Your Experience' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write a review here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
