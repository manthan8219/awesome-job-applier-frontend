import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/constants';
import { cn } from '@/lib/utils';
import Logo from './Logo';

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900/40 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-neon-cyan/10 text-neon-cyan shadow-glow-soft'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-500">
                soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/5 p-4 font-mono text-[11px] text-slate-500">
        <p>nexus v0.1.0 · mock</p>
      </div>
    </aside>
  );
}
