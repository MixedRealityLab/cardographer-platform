// live view client utils - NB needs to work in browser so using copies of types :-(
import { MESSAGE_TYPE, type KVSet, type KVStore, type ClientMap, type ClientInfo, type ChangeNotif, type HelloSuccessResp } from './liveclienttypes'
import { type Session } from './types'

export enum LIVE_CLIENT_STATUS {
    WAITING_FOR_HELLO,
    ACTIVE,
}
export interface ClientItem extends ClientInfo {
    clientId: string
}
let liveClient:LiveClient
export function getLiveClient(cb:UpdateCallback) {
    if (!liveClient) {
        liveClient = new LiveClient(cb )
    } else {
        liveClient.updateCallback = cb
    }
    return liveClient
}
type UpdateCallback = () => void

export class LiveClient {
    state: KVStore = {}
    clients: ClientItem[] = []
    clientId: string
    seats: string[] = []
    status: LIVE_CLIENT_STATUS = LIVE_CLIENT_STATUS.WAITING_FOR_HELLO
    ws: WebSocket|null = null
    players = {} // players[seat] = clientId
    connecting = false
    failed: string|null = null
    connected = false
    updateCallback: UpdateCallback | null = null

    constructor(cb:UpdateCallback) {
        this.updateCallback = cb
    }
    updated() {
        if (this.updateCallback) {
            this.updateCallback()
        }
    }
    connect = function(url:URL, base:string, session:Session, nickname:string) {
        let _this = this
        if (this.ws) {
            console.log(`liveClient already has websocket; close and re-connect...`)
            try {
                this.ws.close()
            } catch (err) { /* ignore */ }
        }
        const wsurl = `${url.protocol == 'https' ? 'wss' : 'ws'}://${url.host}/${base}wss`
        console.log(`connect to ${wsurl}...`)
        this.connecting = true
        this.updated()
        this.ws = new WebSocket(wsurl)
        this.ws.onerror = (event) => { 
            console.log(`ws error`, event) 
            _this.failed = `websocket error ${event.error}`;
            _this.updated()
        }
        this.ws.onclose = (event) => { 
            console.log(`ws close`, event) 
            _this.failed = `websocket closed`
            _this.updated()
        }
        this.ws.onmessage = (event) => {
            console.log(`ws message`, event.data)
            let msg = JSON.parse(event.data)
            if (msg.type == MESSAGE_TYPE.HELLO_SUCCESS_RESP) {
                _this.clientId = msg.clientId
                console.log(`Hello resp as ${_this.clientId}`)
                _this.connected = true
                _this.handleHello(msg as HelloSuccessResp)
            } else if (msg.type == MESSAGE_TYPE.CHANGE_NOTIF) {
                console.log(`Change notif`)
                _this.handleNotif(msg as ChangeNotif)
            }
            console.log(`clients:`, _this.getClients())
            _this.updated()
        }
        this.ws.onopen = (event) => { 
            console.log(`ws open`)
            const joiningCode = url.searchParams.get('j')
            let helloReq = {
                protocol: 'websocket-room-server:1',
                // server-specific
                roomProtocol: 'cardographer:2',
                roomId: session._id,
                roomCredential: joiningCode, 
                //clientCredential?: string
                clientType: 'live-1',
                //clientId?: string
                clientState: { nickname }
                //readonly?: boolean // default true
            }
            _this.ws.send(JSON.stringify(helloReq))
        }
        _this.updated()
    }
    close = function()  {
        if(this.ws) {
            console.log(`close websocket on destroy`)
            this.ws.close()
            this.ws = null
        }
        this.connected = false
        this.updated()
    }

    changeSeat = function(seat, player) {
        console.log(`change seat ${seat} -> ${player}`)
        for (const s in this.players) {
            if (s!==seat && this.players[s] == this.players[seat]) {
                // can't do 2 at once
                this.players[s] = ''
            }
        }
        // set 
        this.players[seat] = player
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: MESSAGE_TYPE.CHANGE_REQ,
                roomChanges: [
                    {key:'players', value: JSON.stringify(this.players)}]
            }))
        }
        // ?!
        this.updated()
    }

    handleHello(msg: HelloSuccessResp) {
        this.state = msg.roomState
        this.clients = []
        for (const clientId in msg.clients) {
            this.clients.push({ clientId, ...msg.clients[clientId]})
        }
        this.clientId = msg.clientId
        if (msg.roomState.seats) {
            this.seats = JSON.parse(msg.roomState.seats) as string[]
        }
        this.status = LIVE_CLIENT_STATUS.ACTIVE
    }
    handleNotif(msg: ChangeNotif) {
        if (msg.roomChanges) {
            for (const change of msg.roomChanges) {
                if (change.key == 'seats') {
                    if (change.value) {
                        this.seats = JSON.parse(change.value) as string[]
                    } else {
                        this.seats = []
                    }
                }
            }
        }
        applyChanges(this.state, msg.roomChanges)
        if (msg.updateClients) {
            for (const clientId in msg.updateClients){
                let client = this.clients.find((c) => c.clientId == clientId)
                if (client) {
                    applyChanges(client.clientState, msg.updateClients[clientId])
                } else {
                    console.log(`Error: ChangeNotify for unknown client ${clientId}`)
                }
            }
        }
        if (msg.removeClients) {
            for (const clientId of msg.removeClients) {
                const ix = this.clients.findIndex((c) => c.clientId == clientId)
                if (ix>=0) {
                    this.clients.splice(ix, 1)
                }
            }
        }
        if (msg.addClients) {
            for (const clientId in msg.addClients) {
                if (this.clients.find((c) => c.clientId == clientId)) {
                    console.log(`Error: ChangeNotify adds already known client ${clientId}`)
                }
                else {
                    const req = msg.addClients[clientId]
                    let client:ClientItem = {
                        clientId,
                        clientState: req.clientState ?? {},
                        clientType: req.clientType,
                        clientName: req.clientName,
                    }
                    this.clients.push(client)
                }
            }
        }
    }
    getRoomState() : KVStore {
        return this.state
    }
    getClientState(clientId:string) : KVStore {
        return this.clients[clientId]?.clientState
    }
    getClients() : ClientItem[] {
        return this.clients
    }
}

export function applyChanges(store: KVStore, changes: KVSet[]): KVStore {
    if (changes) {
        for (const change of changes) {
            if (change.value === undefined) {
                delete store[change.key]
            } else {
                store[change.key] = change.value
            }
        }
    }
    return store
}