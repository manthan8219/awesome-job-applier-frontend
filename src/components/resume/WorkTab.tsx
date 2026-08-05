import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from './SectionHeading';
import { useResumeProjects } from '@/hooks/useResumeProjects';
import { useSaveResumeProject } from '@/hooks/useSaveResumeProject';
import { useDeleteResumeProject } from '@/hooks/useDeleteResumeProject';
import { cn } from '@/lib/utils';
import type { WorkProject } from '@/types/resume';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

const EMPTY: WorkProject = {
  id: '',
  name: '',
  repo: '',
  period: '',
  role: '',
  summary: '',
};

/** Pull markdown-ish bullets from a Claude paste, mirroring workcontext.ExtractBullets. */
function extractBullets(summary: string): string[] {
  const out: string[] = [];
  for (const line of summary.split('\n')) {
    const trimmed = line.trim();
    let text = trimmed;
    if (text.startsWith('- ')) text = text.slice(2).trim();
    else if (text.startsWith('* ')) text = text.slice(2).trim();
    else if (text.startsWith('• ')) text = text.slice(2).trim();
    else continue;
    if (text) out.push(text);
  }
  return out;
}

function ProjectForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: WorkProject;
  onSave: (p: WorkProject) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<WorkProject>({ ...initial });
  const bullets = extractBullets(form.summary);
  const patch = (p: Partial<WorkProject>) => setForm((f) => ({ ...f, ...p }));
  const valid = form.name.trim().length > 0;

  return (
    <Card className="space-y-4 p-5">
      <SectionHeading>
        {initial.id ? 'Edit project' : 'New project'}
      </SectionHeading>
      <p className="text-sm text-slate-400">
        Paste what Claude wrote about this repo — keep 4–6 strong projects.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Name
          </span>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Payments API"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Repo
          </span>
          <input
            className={inputCls}
            value={form.repo}
            onChange={(e) => patch({ repo: e.target.value })}
            placeholder="github.com/org/repo"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Period
          </span>
          <input
            className={inputCls}
            value={form.period}
            onChange={(e) => patch({ period: e.target.value })}
            placeholder="2024 – Present"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            Role
          </span>
          <input
            className={inputCls}
            value={form.role}
            onChange={(e) => patch({ role: e.target.value })}
            placeholder="Backend Engineer"
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
          Claude summary / notes
        </span>
        <textarea
          className={cn(inputCls, 'h-auto resize-y')}
          rows={6}
          value={form.summary}
          onChange={(e) => patch({ summary: e.target.value })}
          placeholder={
            "Paste Claude's project summary here…\nUse - bullets for achievements — we'll pick them up."
          }
        />
      </label>
      {bullets.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-ink-800/40 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            {bullets.length} bullets captured
          </p>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          loading={saving}
          disabled={!valid}
          onClick={() => onSave(form)}
        >
          {initial.id ? 'Save' : 'Add project'}
        </Button>
      </div>
    </Card>
  );
}
function ProjectCard({
  project,
  onEdit,
  onDelete,
  deleting,
}: {
  project: WorkProject;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const bullets = extractBullets(project.summary);
  const meta = [project.role, project.period, project.repo].filter(Boolean);
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-slate-100">
            {project.name}
          </h4>
          {meta.length > 0 && (
            <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
              {meta.join(' · ')}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={deleting}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onDelete}
            className="text-red-400 hover:text-red-300"
          />
        </div>
      </div>
      {bullets.length > 0 ? (
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li
              key={`${project.id}-${i}`}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-cyan/60" />
              {b}
            </li>
          ))}
        </ul>
      ) : project.summary ? (
        <p className="text-sm text-slate-400">{project.summary}</p>
      ) : null}
    </Card>
  );
}

export function WorkTab() {
  const { data, isLoading, isError, error } = useResumeProjects();
  const save = useSaveResumeProject();
  const del = useDeleteResumeProject();
  const [editing, setEditing] = useState<WorkProject | null>(null);

  const projects = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">
            Step 2 — Your work
          </p>
          <p className="text-sm text-slate-400">
            Projects JobPilot weaves into your rewritten resume.
          </p>
        </div>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setEditing({ ...EMPTY })}
          >
            New project
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="space-y-3 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </Card>
          <Card className="space-y-3 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
      )}

      {isError && (
        <Card className="flex items-center gap-3 p-5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-300">
            Could not load projects:{' '}
            {(error as Error)?.message ?? 'unknown error'}
          </p>
        </Card>
      )}

      {editing && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProjectForm
            initial={editing}
            saving={save.isPending}
            onCancel={() => setEditing(null)}
            onSave={(p) =>
              save.mutate(p, {
                onSuccess: () => setEditing(null),
              })
            }
          />
        </motion.div>
      )}

      {!isLoading && !isError && !editing && projects.length === 0 && (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No projects yet"
            description="Add the repos you shipped — JobPilot blends them into a stronger resume."
            className="py-16"
          />
        </Card>
      )}

      {!editing && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-5 md:grid-cols-2"
        >
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => setEditing({ ...p })}
              onDelete={() => del.mutate(p.id)}
              deleting={del.isPending}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
