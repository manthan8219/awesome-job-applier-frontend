import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TemplatePreview } from './TemplatePreview';
import { RESUME_TEMPLATES } from '@/types/resume';

function templateById(id: string) {
  const t = RESUME_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`missing fallback template ${id}`);
  return t;
}

describe('TemplatePreview', () => {
  it('renders a real miniature resume for the Jake single-column design', () => {
    render(<TemplatePreview template={templateById('jake')} />);
    expect(screen.getByText('Maya Okonkwo')).toBeTruthy();
    expect(screen.getByText('Senior Product Engineer')).toBeTruthy();
    expect(screen.getByText(/Northwind Labs/i)).toBeTruthy();
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(screen.getByText('Experience')).toBeTruthy();
  });

  it('renders a dark sidebar rail for Kendall', () => {
    const { container } = render(
      <TemplatePreview template={templateById('kendall')} />,
    );
    const rail = container.querySelector('[data-testid="template-preview-rail"]');
    expect(rail).toBeTruthy();
    expect(rail?.textContent).toContain('Skills');
    expect(rail?.textContent).toContain('Go');
    expect(rail?.textContent).toContain('Education');
    expect(rail?.textContent).not.toContain('Experience');
    // Kendall's rail is a dark filled column.
    expect((rail as HTMLElement)?.style.backgroundColor).toBe('rgb(17, 24, 39)');
  });

  it('uses the asymmetric column ratio for Deedy', () => {
    const { container } = render(
      <TemplatePreview template={templateById('deedy')} />,
    );
    const rail = container.querySelector('[data-testid="template-preview-rail"]');
    expect(rail).toBeTruthy();
    // Deedy's rail is ~24% of the width (columnRatio 0.76).
    expect((rail as HTMLElement)?.style.width).toBe('24%');
  });

  it('accents the sidebar + name for Macchiato', () => {
    const { container } = render(
      <TemplatePreview template={templateById('macchiato')} />,
    );
    const rail = container.querySelector('[data-testid="template-preview-rail"]');
    expect((rail as HTMLElement)?.style.backgroundColor).toBe(
      'rgb(15, 118, 110)',
    );
    // The name is drawn in the accent color.
    expect(screen.getByText('Maya Okonkwo')).toHaveStyle({
      color: 'rgb(15, 118, 110)',
    });
  });

  it('shows a contact line + ruled headings for Banking', () => {
    render(<TemplatePreview template={templateById('banking')} />);
    expect(screen.getByText(/maya@okonkwo.dev/i)).toBeTruthy();
    expect(screen.getByText('Summary')).toBeTruthy();
  });

  it('applies serif styling for the BillRyan template', () => {
    const { container } = render(
      <TemplatePreview template={templateById('billryan')} />,
    );
    const preview = container.querySelector('[data-testid="template-preview"]');
    expect(preview?.className).toContain('font-serif');
  });
});

