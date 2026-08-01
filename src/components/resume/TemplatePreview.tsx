import { cn } from '@/lib/utils';
import type { ResumeTemplate } from '@/types/resume';

/**
 * Sample persona used for gallery miniatures. It mirrors the backend's
 * `resume.SampleResume()` so the card and the real `/preview.pdf` show the
 * same document — the user judges a template on real content, not abstract
 * bars.
 */
export const SAMPLE_RESUME_PREVIEW = {
  name: 'Maya Okonkwo',
  headline: 'Senior Product Engineer',
  summary:
    'Product engineer with 8+ years building high-scale web platforms. Led a five-person team shipping a payments platform used by 2M customers.',
  skills: ['Go', 'TypeScript', 'React', 'PostgreSQL', 'Kubernetes', 'gRPC', 'CI/CD'],
  experience: [
    {
      title: 'Senior Product Engineer',
      org: 'Northwind Labs',
      period: '2021 — Present',
      bullets: [
        'Led a 5-person team rebuilding the payments platform, cutting checkout latency 40%.',
        'Designed gRPC APIs and an event pipeline processing 12M events/day.',
      ],
    },
    {
      title: 'Software Engineer',
      org: 'Acme Cloud',
      period: '2018 — 2021',
      bullets: [
        'Built a real-time analytics dashboard used by 500+ customers.',
        'Migrated a legacy monolith to microservices with zero downtime.',
      ],
    },
  ],
  education: ['B.Sc. Computer Science, University of Lagos'],
} as const;

/** Sections the sidebar rail owns; everything else flows in the main column. */
const RAIL_SECTION_KEYS = new Set(['skills', 'education']);

function SectionHeading({
  label,
  accentHex,
}: {
  label: string;
  accentHex: string;
}) {
  return (
    <div className="mb-[2px] flex flex-col gap-[1px]">
      <p
        className="text-[4.5px] font-bold uppercase leading-none tracking-[0.08em]"
        style={{ color: accentHex }}
      >
        {label}
      </p>
      <div className="h-px w-full bg-ink-950/20" />
    </div>
  );
}

function SectionContent({
  sectionKey,
  accentHex,
}: {
  sectionKey: string;
  accentHex: string;
}) {
  switch (sectionKey) {
    case 'summary':
      return (
        <p className="text-[4.5px] leading-[1.35] text-ink-950/90">
          {SAMPLE_RESUME_PREVIEW.summary}
        </p>
      );
    case 'skills':
      return (
        <p className="text-[4.5px] leading-[1.4] text-ink-950/90">
          {SAMPLE_RESUME_PREVIEW.skills.join('  ·  ')}
        </p>
      );
    case 'experience':
      return (
        <div className="space-y-[2px]">
          {SAMPLE_RESUME_PREVIEW.experience.map((role) => (
            <div key={role.title} className="space-y-[1px]">
              <div className="flex items-baseline justify-between gap-1">
                <p className="truncate text-[5px] font-bold leading-none text-ink-950">
                  {role.title} · {role.org}
                </p>
                <p className="shrink-0 text-[3px] leading-none text-ink-950/50">
                  {role.period}
                </p>
              </div>
              {role.bullets.slice(0, 2).map((bullet) => (
                <p
                  key={bullet}
                  className="flex gap-[2px] text-[4px] leading-[1.3] text-ink-950/85"
                >
                  <span className="text-[3px]" style={{ color: accentHex }}>
                    •
                  </span>
                  <span>{bullet}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      );
    case 'education':
      return (
        <div className="space-y-[1px]">
          {SAMPLE_RESUME_PREVIEW.education.map((line) => (
            <p key={line} className="text-[4.5px] leading-[1.35] text-ink-950/90">
              {line}
            </p>
          ))}
        </div>
      );
    default:
      return null;
  }
}

/**
 * A miniature, A4-proportioned sample resume drawn from the template manifest.
 * Every visual token (accent, fonts, header alignment, rule, rail side,
 * section order, one-page density) comes from the template the backend serves,
 * so the gallery card previews the real renderer's output.
 */
export function TemplatePreview({ template }: { template: ResumeTemplate }) {
  const {
    layout,
    railSide,
    bodyFont,
    headerAlign,
    showRule,
    accentHex,
    onePage,
    sections,
  } = template;
  const isSidebar = layout === 'sidebar';
  const railRight = railSide === 'right';
  const railSections = sections.filter((s) => RAIL_SECTION_KEYS.has(s.key));
  const mainSections = sections.filter((s) => !RAIL_SECTION_KEYS.has(s.key));
  const fontCls =
    bodyFont === 'mono'
      ? 'font-mono'
      : bodyFont === 'serif'
        ? 'font-serif'
        : 'font-sans';
  const headerAlignCls =
    headerAlign === 'center' ? 'items-center text-center' : 'items-start text-left';

  const header = (
    <header className={cn('flex flex-col gap-[2px]', headerAlignCls)}>
      <p className="text-[11px] font-bold leading-none tracking-wide text-ink-950">
        {SAMPLE_RESUME_PREVIEW.name}
      </p>
      <p
        className="text-[5.5px] font-semibold leading-none"
        style={{ color: accentHex }}
      >
        {SAMPLE_RESUME_PREVIEW.headline}
      </p>
      {showRule !== false && (
        <div
          className="mt-[2px] h-px w-full"
          style={{ backgroundColor: accentHex }}
        />
      )}
    </header>
  );

  const rail = (
    <div
      data-testid="template-preview-rail"
      className="flex w-[38%] shrink-0 flex-col gap-[3px] rounded-[2px] p-[3px]"
      style={{ backgroundColor: `${accentHex}14` }}
    >
      {railSections.map((sec) => (
        <section key={sec.key}>
          <SectionHeading label={sec.label} accentHex={accentHex} />
          <SectionContent sectionKey={sec.key} accentHex={accentHex} />
        </section>
      ))}
    </div>
  );

  return (
    <div
      data-testid="template-preview"
      aria-label={`${template.name} template preview`}
      className={cn(
        'aspect-[210/297] w-full overflow-hidden rounded-md border border-white/10 bg-[#fbfaf8] text-ink-950 shadow-inner',
        fontCls,
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col px-[6%] py-[5%]',
          onePage ? 'gap-[2px]' : 'gap-[3px]',
        )}
      >
        {header}
        <div className="flex min-h-0 flex-1 gap-[6px]">
          {isSidebar && railRight ? rail : null}
          <main className="flex min-w-0 flex-1 flex-col gap-[4px]">
            {mainSections.map((sec) => (
              <section key={sec.key}>
                <SectionHeading label={sec.label} accentHex={accentHex} />
                <SectionContent sectionKey={sec.key} accentHex={accentHex} />
              </section>
            ))}
          </main>
          {isSidebar && !railRight ? rail : null}
        </div>
      </div>
    </div>
  );
}
