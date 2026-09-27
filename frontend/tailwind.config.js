/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep ink text + neutral backgrounds
        ink: {
          DEFAULT: '#1C1917',
          light: '#44403C',
        },
        // Amber/rust primary accent
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Slate-blue secondary
        secondary: {
          50: '#F0F4FF',
          100: '#E0E9FF',
          200: '#C7D7FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Stock status semantic colors
        'in-stock': '#16A34A',
        'low-stock': '#D97706',
        'out-of-stock': '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontVariantNumeric: ['tabular-nums'],
    },
  },
  plugins: [],
}
