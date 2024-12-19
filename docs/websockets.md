# Websockets

For live sessions with webapp...

Note, I had trouble integrating the websocket server with node build, so moved websocket server code to a separate module,
[](https://github.com/cgreenhalgh/websocket-room-server).

## Client

The readonly session card-view webapp view is "/sessions/CARDO-SESSION-ID/cards".

The miro plugin view is "/miro/MIRO-BOARD-ID".

This will be a new tabbed client which is available standalone or embedded within the miro plugin.

## Technical integration

For Sveltekit/websocket support see [this article](https://joyofcode.xyz/using-websockets-with-sveltekit).

Note that vite integration is via vite.config.js whereas svelte production deployment is via src/myserver.js.
