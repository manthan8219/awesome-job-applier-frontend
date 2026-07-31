import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = { title: string; description?: string };

export default function ComingSoonPage({ title, description }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-ink-800/60 text-neon-cyan shadow-glow-soft">
        <Wrench className="h-7 w-7" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-50">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {description ??
            'This section mirrors the TUI but is still being built. The dashboard is live — start there.'}
        </p>
      </div>
      <Link to="/">
        <Button variant="outline" size="sm">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
