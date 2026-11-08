/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        teal: {
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488',
        },
        indigo: {
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 900: '#1e1b4b',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(45 212 191 / 0.25), 0 8px 40px -8px rgb(45 212 191 / 0.35)',
        card: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 20px 40px -24px rgb(0 0 0 / 0.5)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
