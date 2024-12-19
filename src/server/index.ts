// from default node adapter server, https://github.com/sveltejs/kit/blob/main/packages/adapter-node/src/index.js
// without LISTEN_FDS support
import { handler } from 'HANDLER';
import { env } from 'ENV';
import polka from 'polka';

import {addWebsockets} from './websockets';

export const path = env('SOCKET_PATH', false);
export const host = env('HOST', '0.0.0.0');
export const port = env('PORT', !path && '3000');

const server = polka().use(handler);

addWebsockets(server)

server.listen({ path, host, port }, () => {
    console.log(`Listening on ${path || `http://${host}:${port}`}`);
});

export { server };
