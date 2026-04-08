/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#131026',
        'surface-container-low': '#1C192F',
        'surface-container': '#201D33',
        'surface-bright': '#3A364E',
        'on-surface': '#E5DFFD',
        primary: '#4ADADA',
        'primary-container': '#00B8B8',
        'on-primary': '#003737',
        'outline-variant': '#3C4949',
      },
      fontFamily: {
        humane: ['HUMANE-Bold'],
        'jakarta-light': ['PlusJakartaSans-Light'],
        'jakarta-regular': ['PlusJakartaSans-Regular'],
        'jakarta-medium': ['PlusJakartaSans-Medium'],
        'jakarta-semibold': ['PlusJakartaSans-SemiBold'],
        'jakarta-bold': ['PlusJakartaSans-Bold'],
        'jakarta-extrabold': ['PlusJakartaSans-ExtraBold'],
      },
    },
  },
  plugins: [],
}
