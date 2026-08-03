import { describe, expect, it } from 'vitest';
import { extractDocumentBody, normalizeLatexFragment } from './latexPreview';

describe('extractDocumentBody', () => {
  it('extracts the {document} body and drops the preamble', () => {
    const tex =
      '\\documentclass[10pt]{article}\n\\usepackage{enumitem}\n\\begin{document}\nHello\\end{document}\n';
    expect(extractDocumentBody(tex)).toContain('Hello');
    expect(extractDocumentBody(tex)).not.toContain('\\documentclass');
  });

  it('returns the input as-is when there is no document body', () => {
    expect(extractDocumentBody('just some text')).toBe('just some text');
  });
});

describe('normalizeLatexFragment', () => {
  it('maps the custom section macros to a standard \\section*', () => {
    const out = normalizeLatexFragment(
      '\\rsec{Summary}\n\\cvsection{Skills}\n\\cvmainsection{Experience}\n\\cvside{Info}',
    );
    expect(out).toContain('\\section*{Summary}');
    expect(out).toContain('\\section*{Skills}');
    expect(out).toContain('\\section*{Experience}');
    expect(out).toContain('\\section*{Info}');
    expect(out).not.toContain('\\rsec');
  });

  it('strips layout-only commands but keeps content', () => {
    const out = normalizeLatexFragment(
      '\\noindent{\\color{accent}\\textbf{Name}} \\hfill \\vspace{1em} body',
    );
    expect(out).not.toContain('\\color');
    expect(out).not.toContain('\\hfill');
    expect(out).not.toContain('\\vspace');
    expect(out).toContain('\\textbf{Name}');
    expect(out).toContain('body');
  });
});
