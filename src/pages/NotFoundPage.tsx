import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-display text-7xl font-bold neon-text">404</p>
      <p className="text-slate-400">This route drifted off the grid.</p>
      <Link to="/">
        <Button>Return to dashboard</Button>
      </Link>
    </div>
  );
}
