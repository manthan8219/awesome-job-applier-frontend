/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep-space base surfaces
        ink: {
          950: '#05060a',
          900: '#0a0c14',
          800: '#0f1320',
          700: '#161b2e',
          600: '#1e2440',
        },
        // Neon accent ramp
        neon: {
          cyan: '#22d3ee',
          azure: '#38bdf8',
          violet: '#a855f7',
          magenta: '#ec4899',
          lime: '#a3e635',
          amber: '#f59e0b',
        },
        // Job lifecycle states
        status: {
          queued: '#f59e0b',
          running: '#22d3ee',
          completed: '#22c55e',
          failed: '#ef4444',
          cancelled: '#94a3b8',
          pending: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34,211,238,0.35), 0 0 60px rgba(34,211,238,0.15)',
        'glow-violet': '0 0 20px rgba(168,85,247,0.35), 0 0 60px rgba(168,85,247,0.15)',
        'glow-soft': '0 0 24px rgba(56,189,248,0.18)',
        panel: '0 8px 40px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.18), transparent 60%)',
      },
      keyframes: {
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'spin-rev': { to: { transform: 'rotate(-360deg)' } },
        'pulse-glow': {
          '0%,100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-pan': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      animation: {
        'spin-slow': 'spin-slow 3s linear infinite',
        'spin-rev': 'spin-rev 4s linear infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'fade-in': 'fade-in 0.5s ease both',
        'fade-up': 'fade-up 0.5s ease both',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
