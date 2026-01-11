/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        primary: {
          purple: '#A11692',
          'purple-accent': '#A31694',
        },
        text: {
          grey: '#514B50',
        },
        background: {
          'soft-white': '#F5F5F5',
        },
      },
      borderRadius: {
        // Buttons: fully rounded pill shape
        'button': '9999px',
        // Cards: 16px-24px range
        'card': '16px',
        'card-lg': '24px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Roboto',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      fontWeight: {
        // Headings: SemiBold
        heading: '600',
        // Body: Regular
        body: '400',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #A11692 0%, #A31694 100%)',
      },
    },
  },
  plugins: [],
}

