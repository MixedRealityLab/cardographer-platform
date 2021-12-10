const colors = require('tailwindcss/colors')

module.exports = {
	mode: "jit",
	content: [
		"./src/**/*.{html,js,svelte,ts}",
	],
	theme: {
		fontFamily: {
			'title': ['Lato', 'Roboto', 'Open Sans', 'Helvetica', 'Arial', 'sans-serif'],
			'sans': ['Roboto', 'Open Sans', 'Helvetica', 'Arial', 'sans-serif'],
		},
		extend: {},
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			black: colors.black,
			white: colors.white,
			gray: colors.gray,
			blue: colors.indigo,
			red: colors.red,
			green: colors.emerald
		}
	},
	variants: {},
	plugins: [
		require('@tailwindcss/forms'),
	],
}
