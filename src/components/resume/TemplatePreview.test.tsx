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
  it('renders a real miniature resume for a single-column template', () => {
    render(<TemplatePreview template={templateById('classic')} />);
    expect(screen.getByText('Maya Okonkwo')).toBeTruthy();
    expect(screen.getByText('Senior Product Engineer')).toBeTruthy();
    expect(screen.getByText(/Northwind Labs/i)).toBeTruthy();
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(screen.getByText('Experience')).toBeTruthy();
  });

  it('renders skills/education in a rail on the declared side', () => {
    const { container } = render(
      <TemplatePreview template={templateById('sidebar')} />,
    );
    const rail = container.querySelector('[data-testid="template-preview-rail"]');
    expect(rail).toBeTruthy();
    expect(rail?.textContent).toContain('Skills');
    expect(rail?.textContent).toContain('Go');
    expect(rail?.textContent).toContain('Education');
    // The rail owns the rail sections only — experience stays in the main col.
    expect(rail?.textContent).not.toContain('Experience');
  });

  it('leads with the main column for Split (right rail)', () => {
    const { container } = render(
      <TemplatePreview template={templateById('split')} />,
    );
    const preview = container.querySelector('[data-testid="template-preview"]');
    expect(preview?.textContent).toContain('Experience');
    expect(preview?.textContent).toContain('Acme Cloud');
    const rail = container.querySelector('[data-testid="template-preview-rail"]');
    expect(rail?.textContent).toContain('Skills');
  });

  it('applies monospace styling for the Developer template', () => {
    const { container } = render(
      <TemplatePreview template={templateById('developer')} />,
    );
    const preview = container.querySelector('[data-testid="template-preview"]');
    expect(preview?.className).toContain('font-mono');
  });
});
