/** Fixed, non-interactive futuristic backdrop: animated grid + gradient orbs. */
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute -left-32 top-[-10%] h-96 w-96 animate-float rounded-full bg-neon-violet/20 blur-3xl" />
      <div
        className="absolute right-[-10%] top-[20%] h-80 w-80 animate-float rounded-full bg-neon-cyan/15 blur-3xl"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-[-10%] left-1/3 h-72 w-72 animate-float rounded-full bg-neon-magenta/10 blur-3xl"
        style={{ animationDelay: '4s' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />
    </div>
  );
}
