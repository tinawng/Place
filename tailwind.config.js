const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      maxWidth: {
        '9xl': '96rem',
      },
      fontSize: {
        '3xs': '.6rem',
        '2xs': '.65rem',
      },
      boxShadow: {
        '4': '0 2px 4px -1px rgba(0,0,0,.1),0 4px 5px 0 rgba(0,0,0,.07),0 1px 10px 0 rgba(0,0,0,.06)',
        '6': '0 3px 5px -1px rgba(0,0,0,.1),0 6px 10px 0 rgba(0,0,0,.07),0 1px 18px 0 rgba(0,0,0,.06)',
        '8': '0 5px 5px -3px rgba(0,0,0,.1),0 8px 10px 1px rgba(0,0,0,.07),0 3px 14px 2px rgba(0,0,0,.06)',
        '10': '0 6px 6px -3px rgba(0,0,0,.2),0 10px 14px 1px rgba(0,0,0,.14),0 4px 18px 3px rgba(0,0,0,.12)',
        '12': '0 7px 8px -4px rgba(0, 0, 0, 0.2), 0 12px 17px 2px rgba(0, 0, 0, 0.14), 0 5px 22px 4px rgba(0, 0, 0, 0.12)',
        '18': '0 9px 11px -5px rgba(0,0,0,.2),0 18px 28px 2px rgba(0,0,0,.14),0 7px 34px 6px rgba(0,0,0,.12)',
      }
    },
    screens: {
      'sm': '1024px',
      'md': '1081px',
      'lg': '1920px',
      'xl': '2560px',
    },
  },
  plugins: [],
}
