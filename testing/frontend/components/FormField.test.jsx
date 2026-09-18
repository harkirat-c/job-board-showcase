import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import FormField from '../../../src/components/employers/FormField.jsx';

describe('FormField', () => {
  it('renders the label and child input', () => {
    render(
      <FormField label="Email" htmlFor="email">
        <input id="email" />
      </FormField>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows an error state when requested', () => {
    render(
      <FormField label="Email" htmlFor="email" error="Email is required" showError>
        <input id="email" />
      </FormField>
    );

    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
