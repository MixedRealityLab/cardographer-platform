import {sveltekit} from '@sveltejs/kit/vite'
import {SvelteKitPWA} from '@vite-pwa/sveltekit'
// Having this bit in breaks vite build, but works for vite dev
import {wss} from '@cgreenhalgh/websocket-room-server'

const USE_WEBSOCKETS = true
const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server) {
		if (!server.httpServer) return
		if (USE_WEBSOCKETS) {
			console.log('(vite) set up websockets')
			wss.addWebsockets(server.httpServer)
		} else {
			console.log(`WARNING: not attempting to set up websockets in dev mode`)
		}
	}
}
// up to here, and webSocketServer below
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