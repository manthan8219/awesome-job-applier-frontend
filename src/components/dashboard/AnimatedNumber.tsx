import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Smoothly tweens a number from its previous value to the new one. */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = performance.now();
    const fromV = from.current;
    const to = value;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 500);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(fromV + (to - fromV) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        from.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={cn('tabular-nums', className)}>{display}</span>;
}
