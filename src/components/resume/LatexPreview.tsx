import { useEffect, useRef, useState } from 'react';
import { renderLatexPreview } from '@/lib/latexPreview';
import { cn } from '@/lib/utils';
import './latex-preview.css';

/**
 * Live preview of a template's real LaTeX source. latex.js renders the .tex
 * in the browser (no server engine needed); if a document uses constructs it
 * cannot parse, we fall back to showing the raw source.
 */
export function LatexPreview({
  latex,
  className,
}: {
  latex: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setFailed(false);
    container.replaceChildren();
    if (!latex.trim()) return;
    try {
      const fragment = renderLatexPreview(latex);
      container.appendChild(fragment);
    } catch {
      setFailed(true);
    }
  }, [latex]);

  if (failed) {
    return (
      <pre className="no-scrollbar max-h-72 overflow-auto rounded-xl border border-white/5 bg-ink-950/80 p-3 font-mono text-[10px] leading-relaxed text-slate-300">
        {latex}
      </pre>
    );
  }
  return (
    <div
      ref={containerRef}
      data-testid="latex-preview"
      className={cn('latex-preview', className)}
    />
  );
}
