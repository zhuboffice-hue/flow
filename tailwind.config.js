/** @type {import('tailwindcss').Config} */
import tokens from './src/styles/design-tokens.json';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)'
        },
        secondary: {
          DEFAULT: 'var(--color-text-secondary)',
          foreground: 'var(--color-surface)'
        },
        muted: 'var(--color-muted)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)'
        }
      },
      fontFamily: {
        sans: tokens.typography.family.split(',').map(f => f.trim().replace(/['"]/g, '')),
      },
      fontSize: tokens.typography.sizes,
      fontWeight: tokens.typography.weights,
      borderRadius: tokens.radius,
      boxShadow: tokens.shadows
    },
  },
  plugins: [],
}
