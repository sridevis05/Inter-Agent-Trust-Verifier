/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030712',      // Deep black slate
          card: '#0f172a',      // Dark slate card
          primary: '#3b82f6',   // Neon blue
          secondary: '#a855f7', // Neon purple
          success: '#10b981',   // Cyber green
          warning: '#f59e0b',   // Cyber amber
          danger: '#ef4444',    // Cyber red
          glow: '#1e1b4b',      // Glowing base color
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.4)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.4)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}
