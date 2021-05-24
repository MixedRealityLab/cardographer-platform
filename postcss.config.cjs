const cssnano = require('cssnano')
const postcssImport = require('postcss-import')
const postcssPresetEnv = require('postcss-preset-env')
const tailwindCSS = require('tailwindcss')
const purgecss = require('@fullhuman/postcss-purgecss')

const mode = process.env.NODE_ENV;
const production = mode === 'production';

// svelte class: support - se https://github.com/tailwindlabs/tailwindcss/discussions/1731
const svelteExtractor = ( content ) => {
	const regExp = new RegExp(/[A-Za-z0-9-_:/]+/g)
	const matchedTokens = []
	let match = regExp.exec(content)

	while (match) {
		if (match[0].startsWith('class:')) {
			matchedTokens.push(match[0].substring(6))
		} else {
			matchedTokens.push(match[0])
		}
		match = regExp.exec(content)
	}
	return matchedTokens
}

module.exports = {
	plugins: [
		postcssImport,
		tailwindCSS(),
		postcssPresetEnv({
			features: {
				// https://github.com/tailwindcss/tailwindcss/issues/1190
				'focus-within-pseudo-class': false,
				'nesting-rules': true, // delete if you don’t want nesting (optional)
			},
		}),
		production && purgecss({
			content: [
				'./**/**/*.html',
				'./**/**/*.svelte'
			],
			whitelistPatterns: [/svelte-/],
			//defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
			extractors: [
				{extractor: svelteExtractor, extensions: [ 'svelte', 'css', 'html' ], },
			]
		}),
		production && cssnano({
			preset: [
				'default',
				{discardComments: {removeAll: true}},
			],
		}),
	].filter(Boolean)
}
