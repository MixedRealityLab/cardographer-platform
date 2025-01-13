// live view client utils - NB needs to work in browser so using copies of types :-(
import { MESSAGE_TYPE, type KVSet, type KVStore, type ClientMap, type ClientInfo, type ChangeNotif, type HelloSuccessResp } from './liveclienttypes'

export enum LIVE_CLIENT_STATUS {
    WAITING_FOR_HELLO,
    ACTIVE,
}
export interface ClientItem extends ClientInfo {
    clientId: string
}
export class LiveClient {
    state: KVStore = {}
    clients: ClientItem[] = []
    clientId: string
    seats: string[] = []
    status: LIVE_CLIENT_STATUS = LIVE_CLIENT_STATUS.WAITING_FOR_HELLO

    constructor() {}
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