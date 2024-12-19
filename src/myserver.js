// from default node adapter server, https://github.com/sveltejs/kit/blob/main/packages/adapter-node/src/index.js
// without LISTEN_FDS support
import { handler } from '../build/handler.js';
import { env } from '../build/env.js';
import polka from 'polka';
import {wss} from '@cgreenhalgh/websocket-room-server'

export const path = env('SOCKET_PATH', false);
export const host = env('HOST', '0.0.0.0');
export const port = env('PORT', !path && '3000');

const app = polka().use(handler);

const { server } = app.listen({ path, host, port }, () => {
    console.log(`Listening on ${path || `http://${host}:${port}`}`);
});
// add my websockets to HTTP server
wss.addWebsockets(server)

export { app };
