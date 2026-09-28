import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ace: {
          50: '#eef1fa',
          100: '#d5daf2',
          200: '#a9b4e5',
          300: '#7d8fd8',
          400: '#5a71c2',
          500: '#4259a9',
          600: '#364a8e',
          700: '#2a3a71',
          800: '#1e2a54',
          900: '#121a37',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
