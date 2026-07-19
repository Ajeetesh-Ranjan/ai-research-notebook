import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuggestedPrompts } from '@/components/ai/SuggestedPrompts';

describe('SuggestedPrompts', () => {
  it('renders suggested prompt buttons', () => {
    render(<SuggestedPrompts onSelect={() => {}} />);
    expect(screen.getByText('Summarize the key findings')).toBeInTheDocument();
    expect(screen.getByText('Compare with previous research')).toBeInTheDocument();
    expect(screen.getByText('Extract main arguments')).toBeInTheDocument();
    expect(screen.getByText('Analyze methodology')).toBeInTheDocument();
  });
});
