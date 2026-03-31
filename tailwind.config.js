module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          50: '#F3F0FF',
          100: '#E8E1FF',
          200: '#D0C1FF',
          300: '#B8A1FF',
          400: '#9A7BFF',
          500: '#7F5AF0',
          600: '#6246EA',
          700: '#4A36B8',
          800: '#352786',
          900: '#231C54',
        },

        // Surface Colors (Dark Mode)
        surface: {
          50: '#F8F8FA',
          100: '#F0F0F5',
          200: '#E0E0EB',
          300: '#C0C0D6',
          400: '#A0A0C2',
          500: '#8080AD',
          600: '#606099',
          700: '#404075',
          800: '#2E2E42',
          900: '#1A1A2E',
        },

        // Background
        background: '#0F0F1A',

        // Text
        text: {
          primary: '#FFFFFF',
          secondary: '#B8B8D1',
          disabled: '#6B6B8A',
        },
      },

      // Modern Border Radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Shadows
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'medium': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'hard': '0 12px 48px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 32px rgba(127, 90, 240, 0.3)',
      },

      // Animations
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};