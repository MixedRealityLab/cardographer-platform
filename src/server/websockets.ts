import {WebSocketServer} from 'ws';

const path = '/cardws'
export function addWebsockets(server) {

    console.log(`Set up websockets on ${path}...`)
    // This causes Invalid Frame Header error from client when running in Vite
    // and on('upgrade') doesn't seem to be an option with polka (?)
    const wss = new WebSocketServer({ server, path });

    // TODO proper websocket setup
    wss.on('connection', function connection(ws) {
        console.log(`Connected websocket`);
        ws.on('error', console.error);

        ws.on('message', function message(data) {
            console.log('received: %s', data);
        });

        ws.send('something');
    });
}