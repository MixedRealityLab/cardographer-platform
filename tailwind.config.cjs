module.exports = {
  purge: false, // purge handle by postcss
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
