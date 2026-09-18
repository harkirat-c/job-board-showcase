import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import Skills from '../../../src/components/Skills.jsx';

describe('Skills', () => {
  it('shows existing skills', () => {
    render(<Skills skills={['React', 'Node']} />);

    expect(screen.getByTitle('React')).toBeInTheDocument();
    expect(screen.getByTitle('Node')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Skill +' })).toBeInTheDocument();
  });
});
