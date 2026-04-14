import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './app/**/*.{vue,ts,tsx}',
    './components/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#1c1c24',
        surface: '#25252f',
        surfaceLight: '#2d2d3a',
        primary: '#6366f1',
        accent: '#a855f7',
        ok: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 0 20px 2px rgba(99, 102, 241, 0.3)',
        'glow-accent': '0 0 20px 2px rgba(168, 85, 247, 0.3)',
        'glow-ok': '0 0 12px 2px rgba(34, 197, 94, 0.4)',
        'glow-warning': '0 0 12px 2px rgba(245, 158, 11, 0.4)',
        'glow-danger': '0 0 12px 2px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  plugins: [],
}