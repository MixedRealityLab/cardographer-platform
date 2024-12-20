import {sveltekit} from '@sveltejs/kit/vite'
import {SvelteKitPWA} from '@vite-pwa/sveltekit'

const code = await import('./src/lib/websockets.ts')

const USE_WEBSOCKETS = true
const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server) {
		if (!server.httpServer) return
		if (USE_WEBSOCKETS) {
			code.wss.addWebsockets(server.httpServer)
		} else {
			console.log(`WARNING: not attempting to set up websockets in dev mode`)
		}
	}
}

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), webSocketServer, SvelteKitPWA()],
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