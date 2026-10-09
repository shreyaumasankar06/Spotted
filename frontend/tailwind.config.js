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
        spotted: {
          bg: '#08060B',
          panel: '#120D18',
          elevated: '#1B1223',
          purple: '#A855F7',
          pink: '#FF3CAC',
          spreading: '#FF365E',
          contained: '#39F5A5',
          unaware: '#756B80',
          text: '#F8F3FF',
          muted: '#B7A9C9',
          border: '#261A33',
        },
      },
      fontFamily: {
        serif: ['"Bodoni Moda"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
