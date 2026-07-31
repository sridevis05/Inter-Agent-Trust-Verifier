/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Redefine colors to implement a strict monochrome / black & white theme
        black: '#000000',
        white: '#ffffff',
        
        slate: {
          50: '#f9f9f9',
          100: '#f3f3f3',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1a1a1a',
          900: '#121212',
          950: '#000000',
        },
        
        blue: {
          50: '#ffffff',
          100: '#f9f9f9',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#ffffff', // Map blue to white for premium high-contrast accents
          600: '#f3f3f3',
          700: '#e5e5e5',
          800: '#262626',
          900: '#121212',
          950: '#000000',
        },
        
        red: {
          50: '#ffffff',
          100: '#f3f3f3',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#ffffff', // Mapped to clean white
          500: '#a3a3a3',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#121212',
          950: '#0a0a0a',
        },
        
        emerald: {
          50: '#ffffff',
          100: '#f3f3f3',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#ffffff',
          500: '#a3a3a3',
          600: '#404040',
          700: '#262626',
          800: '#1c1c1c',
          900: '#121212',
          950: '#000000',
        },
        
        purple: {
          50: '#ffffff',
          100: '#f3f3f3',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#ffffff',
          500: '#a3a3a3',
          600: '#404040',
          700: '#262626',
          800: '#1a1a1a',
          900: '#121212',
          950: '#000000',
        },
        
        indigo: {
          400: '#ffffff',
        },
        
        yellow: {
          100: '#f9f9f9',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#ffffff',
          500: '#a3a3a3',
          900: '#121212',
          950: '#000000',
        },

        cyber: {
          dark: '#000000',
          card: '#0a0a0a',
          primary: '#ffffff',
          secondary: '#a3a3a3',
          success: '#ffffff',
          warning: '#737373',
          danger: '#ffffff',
          glow: '#171717',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(255, 255, 255, 0.1)',
        'glow-purple': '0 0 15px rgba(255, 255, 255, 0.05)',
        'glow-green': '0 0 15px rgba(255, 255, 255, 0.1)',
        'glow-red': '0 0 15px rgba(255, 255, 255, 0.1)',
      }
    },
  },
  plugins: [],
}
