import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LatexPreview } from './LatexPreview';
import { renderLatexPreview } from '@/lib/latexPreview';

vi.mock('@/lib/latexPreview', () => ({
  extractDocumentBody: (tex: string) => tex,
  normalizeLatexFragment: (body: string) => body,
  renderLatexPreview: vi.fn(),
}));

const mockedRender = vi.mocked(renderLatexPreview);
const SAMPLE_TEX =
  '\\documentclass{article}\n\\begin{document}\n{\\Large\\textbf{Maya Okonkwo}}\n\\section*{Summary}\nShip things.\n\\end{document}\n';

function fragmentWithText(text: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  const p = document.createElement('p');
  p.textContent = text;
  frag.appendChild(p);
  return frag;
}

describe('LatexPreview', () => {
  it('renders the latex.js output into the container', async () => {
    mockedRender.mockImplementation(() =>
      fragmentWithText('Maya Okonkwo — Senior Product Engineer'),
    );
    render(<LatexPreview latex={SAMPLE_TEX} />);

    expect(await screen.findByText(/Maya Okonkwo/)).toBeInTheDocument();
    expect(mockedRender).toHaveBeenCalledWith(SAMPLE_TEX);
  });

  it('falls back to the raw source when latex.js cannot parse the document', async () => {
    mockedRender.mockImplementation(() => {
      throw new Error('macro only allowed in preamble: documentclass');
    });
    render(<LatexPreview latex={SAMPLE_TEX} />);

    // The <pre> fallback shows the raw .tex so the user still sees content.
    const pre = await screen.findByText(/Maya Okonkwo/);
    expect(pre.tagName).toBe('PRE');
  });
});
