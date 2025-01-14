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
type UpdateCallback = (c:LiveClient, clientsChanged:boolean) => void
interface ZoneCardMap {
    [zone:string]: string[]
}
interface PlayerMap {
    [seat:string]: string // connection
}
export class LiveClient {
    state: KVStore = {}
    clients: ClientItem[] = []
    clientId: string
    seats: string[] = []
    status: LIVE_CLIENT_STATUS = LIVE_CLIENT_STATUS.WAITING_FOR_HELLO
    ws: WebSocket|null = null
    players: PlayerMap = {} // players[seat] = clientId
    connecting = false
    failed: string|null = null
    connected = false
    updateCallback: UpdateCallback | null = null
    activeZones: string[] = []
    zoneCards: ZoneCardMap = {}

    constructor(cb:UpdateCallback) {
        this.updateCallback = cb
    }
    updated(clientsChanged:boolean) {
        if (this.updateCallback) {
            this.updateCallback(this, clientsChanged)
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
        this.updated(false)
        this.ws = new WebSocket(wsurl)
        this.ws.onerror = (event) => { 
            console.log(`ws error`, event) 
            _this.failed = `websocket error ${event.error}`;
            _this.updated(false)
        }
        this.ws.onclose = (event) => { 
            console.log(`ws close`, event) 
            _this.failed = `websocket closed`
            _this.updated(false)
        }
        this.ws.onmessage = (event) => {
            let clientsChanged = false
            console.log(`ws message`, event.data)
            let msg = JSON.parse(event.data)
            if (msg.type == MESSAGE_TYPE.HELLO_SUCCESS_RESP) {
                _this.clientId = msg.clientId
                console.log(`Hello resp as ${_this.clientId}`)
                _this.connected = true
                _this.handleHello(msg as HelloSuccessResp)
            } else if (msg.type == MESSAGE_TYPE.CHANGE_NOTIF) {
                console.log(`Change notif`)
                clientsChanged = _this.handleNotif(msg as ChangeNotif) || clientsChanged
            }
            //console.log(`clients:`, _this.getClients())
            _this.updated(clientsChanged)
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
        _this.updated(false)
    }
    close = function()  {
        if(this.ws) {
            console.log(`close websocket on destroy`)
            this.ws.close()
            this.ws = null
        }
        this.connected = false
        this.updated(false)
    }

    changeSeat = function(seat, player) {
        console.log(`change seat ${seat} -> ${player}...`)
        this.ws.send(JSON.stringify({
            type: MESSAGE_TYPE.ACTION_REQ,
            action: 'changeSeat',
            data: JSON.stringify({seat,player}),
        }))
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
        if (msg.roomState.activeZones) {
            this.activeZones = JSON.parse(msg.roomState.activeZones) as string[]
        }
        for (const k of Object.keys(msg.roomState)) {
            if (k.substring(0,6)=='cards:') {
                const zone = k.substring(6)
                this.zoneCards[zone] = JSON.parse(msg.roomState[k])
            } else if (k.substring(0,7)=='player:') {
                const seat = k.substring(7)
                this.players[seat] = msg.roomState[k]
            }
        }
        this.status = LIVE_CLIENT_STATUS.ACTIVE
    }
    // return clients changed
    handleNotif(msg: ChangeNotif): boolean {
        let clientsChanged = false
        if (msg.roomChanges) {
            for (const change of msg.roomChanges) {
                if (change.key == 'seats') {
                    if (change.value) {
                        this.seats = JSON.parse(change.value) as string[]
                    } else {
                        this.seats = []
                    }
                    clientsChanged = true
                }
                if (change.key == 'activeZones') {
                    if (change.value) {
                        this.activeZones = JSON.parse(change.value) as string[]
                    } else {
                        this.activeZones = []
                    }
                }
                if (change.key.substring(0,6)=='cards:') {
                    const zone = change.key.substring(6)
                    if (change.value) {
                        this.zoneCards[zone] = JSON.parse(change.value)
                    } else {
                        delete this.zoneCards[zone]
                    }
                }
                if (change.key.substring(0,7)=='player:') {
                    const seat = change.key.substring(7)
                    if (change.value) {
                        this.players[seat] = change.value
                    } else {
                        delete this.players[seat]
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
            clientsChanged = true
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
            clientsChanged = true
        }
        return clientsChanged
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