import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';

// svelte dev seems to struggle with base being set 1.0.0
const mode = process.env.NODE_ENV;
const production = mode === 'production';

const PRODUCTION_BASE = '/platform/';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess({
		postcss: true,
	}),

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		paths: {
			base: (production ? PRODUCTION_BASE : ''),
			//assets: ''                  
		},
		adapter: adapter({
			// default options are shown
			out: 'build'
		}),
		vite: {
			optimizeDeps: {
				include: ["csv-stringify", "csv-parse"]
			}
		}
	}
};

export default config;
