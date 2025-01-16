import {sveltekit} from '@sveltejs/kit/vite'
import {SvelteKitPWA} from '@vite-pwa/sveltekit'

// no websockets here :-) see vite-dev.config.js

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), SvelteKitPWA()],
	server: {
		port: 3000,
		fs: {
			allow: [
				'/app/uploads/'
			]
		}
	},
	optimizeDeps: {
		include: ["csv-stringify", "csv-parse"]
	}
};

export default config;