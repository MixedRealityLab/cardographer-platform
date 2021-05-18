import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-node';

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
			base: '', // '/' - not working for client nav?
			assets: ''                  
		},                                  
		adapter: adapter({
			// default options are shown
			out: 'build'
		})
	},

	vite: {
		optimizeDeps: {
			include: ["csv"]
		}
	}
};

export default config;
