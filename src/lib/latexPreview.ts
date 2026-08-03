import { HtmlGenerator, parse } from 'latex.js';

/** Custom section macros the resume templates define in their preamble. */
const SECTION_MACROS = ['rsec', 'cvsection', 'cvside', 'cvmainsection'];

/**
 * Extract the {document} body from a full .tex document. latex.js's parse
 * handles fragments, not preambles, so the preamble is dropped before
 * rendering.
 */
export function extractDocumentBody(tex: string): string {
  const m = tex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  return m?.[1] ?? tex;
}

/**
 * Normalize a document body for latex.js: map the templates' custom section
 * macros to a standard \section* and drop the layout-only commands latex.js
 * does not model (colors, spacing glue). Content is preserved; styling is
 * handled by the component's scoped CSS.
 */
export function normalizeLatexFragment(body: string): string {
  let out = body;
  for (const macro of SECTION_MACROS) {
    out = out.replace(new RegExp(`\\\\${macro}\\{`, 'g'), '\\section*{');
  }
  return out
    .replace(/\\noindent\b/g, '')
    .replace(/\\color\{[^}]*\}/g, '')
    .replace(/\\textcolor\{[^}]*\}/g, '')
    .replace(/\\hfill\b/g, '')
    .replace(/\\hspace\{[^}]*\}/g, '')
    .replace(/\\vspace\{[^}]*\}/g, '');
}

/**
 * Render a full LaTeX document (as produced by the backend) into a DOM
 * fragment using latex.js — the real .tex, not a mock. Throws when the
 * document uses constructs latex.js cannot parse; callers fall back to the
 * raw source.
 */
export function renderLatexPreview(latex: string): DocumentFragment {
  const body = normalizeLatexFragment(extractDocumentBody(latex));
  const generator = new HtmlGenerator({ hyphenate: false });
  const result = parse(body, { generator });
  return result.domFragment();
}
