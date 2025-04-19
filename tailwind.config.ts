import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'fluid-bg': 'rgb(13, 13, 13)',
        'fluid-primary': 'rgb(37, 202, 172)',
        'fluid-white': 'rgb(255, 255, 255)',
        'fluid-white-70': 'rgba(255, 255, 255, 0.7)',
        'fluid-white-10': 'rgba(255, 255, 255, 0.1)',
        'fluid-white-6': 'rgba(255, 255, 255, 0.06)',
        'fluid-purple': 'rgb(55, 0, 110)',
      },
      fontFamily: {
        outfit: ['var(--font-outfit)'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontSize: {
        'hero-title': [
          '80px',
          {
            lineHeight: '1',
            letterSpacing: '-0.02em',
            fontWeight: '500',
          },
        ],
        'hero-text': [
          '22px',
          {
            lineHeight: '1.4',
            letterSpacing: '-0.01em',
            fontWeight: '400',
          },
        ],
      },
    },
  },
  plugins: [typography, forms],
};

export default config;
