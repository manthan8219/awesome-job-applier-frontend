import {
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  LayoutDashboard,
  Radar,
  ScrollText,
  Send,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { AppStatus, Outcome } from '@/types';
import type { OutreachStatus } from '@/types/outreach';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

/**
 * Nexus app sections — the Dashboard is the default screen (first-run users
 * land on /onboarding, then the Dashboard). Config is a secondary page for
 * the full 39-field profile; Resume, Jobs, Companies, Outreach, Contacts,
 * and Logs mirror their TUI counterparts and are all live.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/outreach', label: 'Outreach', icon: Send },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/response', label: 'Response', icon: Radar },
];

/** Work-type options (mirrors the TUI's wtOptions). */
export const WORK_TYPES = ['Remote', 'Onsite', 'Hybrid'] as const;

import type { LiveStatus } from '@/types';

export interface LiveMeta {
  label: string;
  dot: string;
  badge: string;
}

/**
 * Full literal class strings so Tailwind's JIT detects them at build time.
 * Color semantics mirror the TUI palette (green=ok, red=fail, cyan=live,
 * violet=queued, grey=skipped/dry-run).
 */
export const LIVE_META: Record<LiveStatus, LiveMeta> = {
  applied: {
    label: 'applied',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  found: {
    label: 'found',
    dot: 'bg-neon-cyan',
    badge: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  },
  queued: {
    label: 'queued',
    dot: 'bg-neon-violet',
    badge: 'bg-neon-violet/10 text-neon-violet border-neon-violet/30',
  },
  failed: {
    label: 'failed',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
  skipped: {
    label: 'skipped',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
  'dry-run': {
    label: 'dry-run',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

/**
 * Application status metadata (mirrors store.Status). Full literal class strings
 * so Tailwind's JIT keeps them.
 */
export const APP_STATUS_META: Record<
  AppStatus,
  { label: string; dot: string; badge: string }
> = {
  applied: {
    label: 'applied',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  skipped: {
    label: 'skipped',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
  failed: {
    label: 'failed',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
  queued: {
    label: 'queued',
    dot: 'bg-neon-violet',
    badge: 'bg-neon-violet/10 text-neon-violet border-neon-violet/30',
  },
  'dry-run': {
    label: 'dry-run',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

/**
 * Post-apply outcome metadata (mirrors store.Outcome). The empty key is the
 * "no response yet" state. ORDER mirrors store.OutcomeCycle so the Jobs page
 * can cycle through with one click.
 */
export const OUTCOME_CYCLE: Outcome[] = [
  'replied',
  'interview',
  'offer',
  'rejected',
  'ghosted',
];

export const OUTCOME_META: Record<
  Outcome,
  { label: string; dot: string; badge: string }
> = {
  '': {
    label: 'no response',
    dot: 'bg-slate-600',
    badge: 'bg-slate-600/10 text-slate-400 border-slate-600/30',
  },
  replied: {
    label: 'replied',
    dot: 'bg-neon-cyan',
    badge: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  },
  interview: {
    label: 'interview',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  offer: {
    label: 'offer',
    dot: 'bg-neon-amber',
    badge: 'bg-neon-amber/10 text-neon-amber border-neon-amber/30',
  },
  rejected: {
    label: 'rejected',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
  ghosted: {
    label: 'ghosted',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

/** Outreach item status metadata (mirrors outreach.Status). */
export const OUTREACH_STATUS_META: Record<
  OutreachStatus,
  { label: string; dot: string; badge: string }
> = {
  finding: {
    label: 'finding',
    dot: 'bg-neon-violet',
    badge: 'bg-neon-violet/10 text-neon-violet border-neon-violet/30',
  },
  drafting: {
    label: 'drafting',
    dot: 'bg-neon-violet',
    badge: 'bg-neon-violet/10 text-neon-violet border-neon-violet/30',
  },
  draft: {
    label: 'draft',
    dot: 'bg-slate-400',
    badge: 'bg-slate-400/10 text-slate-300 border-slate-400/30',
  },
  ready: {
    label: 'ready',
    dot: 'bg-neon-cyan',
    badge: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  },
  sent: {
    label: 'sent',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  failed: {
    label: 'failed',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
  skipped: {
    label: 'skipped',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
  opened: {
    label: 'opened',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  followup_due: {
    label: 'follow-up due',
    dot: 'bg-neon-amber',
    badge: 'bg-neon-amber/10 text-neon-amber border-neon-amber/30',
  },
  sequence_done: {
    label: 'sequence done',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
  replied: {
    label: 'replied',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  bounced: {
    label: 'bounced',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
};
