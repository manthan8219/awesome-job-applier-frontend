import { ScanBarLoader } from '@/components/loaders';

/** Step 3: brief transition while the safe dry run kicks off. */
export function LaunchStep() {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <ScanBarLoader />
      <h1 className="font-display text-xl font-semibold text-slate-50">
        Starting your first search…
      </h1>
      <p className="max-w-md text-sm text-slate-400">
        Nexus is scanning job boards for roles that match. This is a safe dry
        run — nothing is submitted, and matches stream in live on the
        dashboard.
      </p>
    </div>
  );
}
