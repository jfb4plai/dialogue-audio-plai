import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jfb-noir':      '#1a1a1a',
        'jfb-noir-doux': '#2e2e2e',
        'jfb-rose':      '#FF3399',
        'jfb-rose-dk':   '#CC0070',
        'jfb-beige':     '#F5F0E8',
        'jfb-beige-dk':  '#E8E0D0',
        'jfb-gris':      '#5a5a5a',
        'jfb-gris-cl':   '#909090',
        'jfb-bordure':   '#e8e8e8',
        'jfb-subtil':    '#f9f9f7',
      },
    },
  },
  plugins: [],
}
export default config
