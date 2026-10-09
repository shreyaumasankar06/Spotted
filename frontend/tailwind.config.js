/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          darkest: '#080C14',
          dark: '#0F172A',
          card: '#1E293B',
          hover: '#334155',
        },
        brand: {
          primary: '#8B5CF6',
          hover: '#7C3AED',
          accent: '#A78BFA',
          glow: 'rgba(139, 92, 246, 0.25)',
        },
        node: {
          unaware: '#64748B',
          active: '#EF4444',
          contained: '#10B981',
          source: '#F59E0B',
        }
      },
    },
  },
  plugins: [],
}
