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
        },
        accent: {
          DEFAULT: 'var(--sys-accent)',
          dark: 'var(--sys-accent-dark)',
        },
        surface: 'var(--sys-surface)',
        'surface-muted': 'var(--sys-surface-muted)',
        'surface-raised': 'var(--sys-surface-raised)',
        background: 'var(--sys-background)',
        foreground: 'var(--sys-on-background)',
        muted: 'var(--sys-on-surface-muted)',
        border: 'var(--sys-outline)',
        'border-strong': 'var(--sys-outline-strong)',
        success: 'var(--sys-success)',
        warning: 'var(--sys-warning)',
        error: 'var(--sys-error)',
      },
    },
  },
  plugins: [],
};
