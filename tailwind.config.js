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
        },
        surface: 'var(--sys-surface)',
        background: 'var(--sys-background)',
      },
    },
  },
  plugins: [],
};
