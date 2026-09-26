/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--sys-primary)',
          light: 'var(--sys-primary-light)',
          dark: 'var(--sys-primary-dark)',
          foreground: 'var(--sys-on-primary)',
        },
        accent: {
          DEFAULT: 'var(--sys-accent)',
          light: 'var(--sys-accent-light)',
          dark: 'var(--sys-accent-dark)',
          foreground: 'var(--sys-on-accent)',
        },
        surface: 'var(--sys-surface)',
        'surface-muted': 'var(--sys-surface-muted)',
        'surface-raised': 'var(--sys-surface-raised)',
        'surface-highest': 'var(--sys-surface-highest)',
        background: 'var(--sys-background)',
        foreground: 'var(--sys-on-background)',
        'on-surface': 'var(--sys-on-surface)',
        muted: 'var(--sys-on-surface-muted)',
        border: 'var(--sys-outline)',
        'border-strong': 'var(--sys-outline-strong)',
        success: 'var(--sys-success)',
        warning: 'var(--sys-warning)',
        error: 'var(--sys-error)',
        'on-error': 'var(--sys-on-error)',
      },
    },
  },
  plugins: [],
};
