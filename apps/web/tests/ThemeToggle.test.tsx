import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '@/components/settings/ThemeToggle';

describe('ThemeToggle', () => {
  it('renders three theme options', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
