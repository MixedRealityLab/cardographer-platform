import {sveltePreprocess} from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: sveltePreprocess({
		postcss: true,
	}),

	kit: {
		paths: {
			base: '',
			assets: ''
		},
		adapter: adapter({
			// default options are shown
			out: 'build'
		})
	}
};

export default config;
