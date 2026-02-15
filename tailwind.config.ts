import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F6EFE7',
        stone: {
          50: '#FBF8F4',
          100: '#F6EFE7',
          200: '#EBE0D3',
          800: '#5C3A21',
          900: '#3D2616',
        },
        amber: {
          50: '#FFF8F1',
          400: '#E6AD6E',
          500: '#C7782A',
          600: '#A8611E',
          700: '#8A4D16',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;