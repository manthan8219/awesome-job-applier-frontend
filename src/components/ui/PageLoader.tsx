import OrbitLoader from '@/components/loaders/OrbitLoader';

export function PageLoader({ label = 'Syncing with control plane' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <OrbitLoader size={72} />
      <p className="font-mono text-sm text-slate-400">{label}…</p>
    </div>
  );
}
