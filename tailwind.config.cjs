module.exports = {
	mode: "jit",
	purge: [
		"./src/**/*.{html,js,svelte,ts}",
	],
	theme: {
		fontFamily: {
			'sans': ['Roboto', 'Open Sans', 'Helvetica', 'Arial', 'sans-serif'],
		},
		extend: {},
	},
	variants: {},
	plugins: [
		require('@tailwindcss/forms'),
	],
}
