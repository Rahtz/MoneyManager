/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'light-black': '#1d1d1d',
        'nav-text': '#595959',
        'nav-text-active': '#d7d7d7',
        'lightBlackButtons': '#272727',
      },
      backgroundColor: {
        'custom-active': '#292929'
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Internet Explorer 10+ */
          '-ms-overflow-style': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },],
}
