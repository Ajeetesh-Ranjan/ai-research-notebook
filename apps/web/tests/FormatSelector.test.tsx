import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormatSelector } from '@/components/export/FormatSelector';

describe('FormatSelector', () => {
  it('renders format options', () => {
    render(
      <FormatSelector formats={['markdown', 'pdf', 'html', 'docx']} selected="pdf" onSelect={() => {}} />
    );
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.getByText('Word')).toBeInTheDocument();
  });

  it('highlights the selected format', () => {
    render(
      <FormatSelector formats={['markdown', 'pdf']} selected="pdf" onSelect={() => {}} />
    );
    const pdfButton = screen.getByText('PDF').closest('button');
    expect(pdfButton).toHaveClass('border-primary-500');
  });
});
