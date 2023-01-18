import {sveltekit} from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
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