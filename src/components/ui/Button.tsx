import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary:
    'text-ink-950 bg-gradient-to-r from-neon-cyan to-neon-azure hover:shadow-glow-cyan hover:brightness-110',
  secondary:
    'text-slate-100 bg-ink-700/70 hover:bg-ink-600/70 border border-white/10',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  outline: 'text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/10',
  danger: 'text-white bg-red-500/90 hover:bg-red-500 border border-red-400/40',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
      </button>
    );
  },
);
