// live view client utils - NB needs to work in browser so using copies of types :-(
import { type SnapshotInfo } from './analysistypes';
import { getSnapshotInfoFromMiroData } from './clients/miroutils';
import { MESSAGE_TYPE, type KVSet, type KVStore, type ClientMap, type ClientInfo, type ChangeNotif, type HelloSuccessResp, type ChangeReq, type ActionReq } from './liveclienttypes'
import { getChangesFromMiroState } from './liveutils';
import { type Session } from './types'
import type { Miro,ItemsCreateEvent, ItemsDeleteEvent, ItemsUpdateEvent } from "@mirohq/websdk-types";

export const SPOTLIGHT_ZONE = "Spotlight"
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
interface SpotlightMap {
    [cardId:string]: string // text, e.g. nickname
}
interface MoveCardsInMiroReq {
    from:string
    to:string
    cards:string[]
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
    namename: string = 'anon'
    spotlights: SpotlightMap = {}
    readonly: boolean 
    numberReadonly: number = 0
    isMirobridge:boolean = false
    miro: Miro

    constructor(cb:UpdateCallback) {
        this.updateCallback = cb
    }
    updated(clientsChanged:boolean) {
        if (this.updateCallback) {
            this.updateCallback(this, clientsChanged)
        }
    }
    connect = function(url:URL, base:string, session:Session, nickname:string, 
        joiningCode:string, miro: Miro|null) {
        let _this = this
        this.nickname = nickname
        this.miro = miro
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
            } else if (msg.type == MESSAGE_TYPE.ACTION_REQ) {
                let action = msg as ActionReq
                if (action.action == 'moveCardsInMiro' 
                    && _this.state['mirobridge']==_this.clientId) {
                    let data = JSON.parse(action.data) as MoveCardsInMiroReq
                    _this.moveCardsInMiro(data.cards, data.from, data.to)
                } else {
                    console.log(`ignored action request ${action.action}`)
                }
            }
            //console.log(`clients:`, _this.getClients())
            _this.updated(clientsChanged)
            if (_this.isMirobridge) {
                _this.checkMiroAfterMessage()
            }
        }
        this.ws.onopen = (event) => { 
            console.log(`ws open`)
            let helloReq = {
                protocol: 'websocket-room-server:1',
                // server-specific
                roomProtocol: 'cardographer:2',
                roomId: session._id,
                roomCredential: joiningCode, 
                //clientCredential?: string
                clientType: 'live-1',
                //clientId?: string
                clientState: { nickname, inmiro: `${miro!=null}` }
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

    changeSeat = function(seat:string, player:string) {
        console.log(`change seat ${seat} -> ${player}...`)
        this.ws.send(JSON.stringify({
            type: MESSAGE_TYPE.ACTION_REQ,
            action: 'changeSeat',
            data: JSON.stringify({seat,player}),
        }))
    }
    moveCards = function(cardIds:string[], fromZone:string, toZone:string) {
        console.log(`move cards ${cardIds} from ${fromZone} to ${toZone}`)
        this.ws.send(JSON.stringify({
            type: MESSAGE_TYPE.ACTION_REQ,
            action: 'moveCards',
            data: JSON.stringify({
                cards:cardIds,
                from:fromZone,
                to:toZone,
                //autoReturn: toZone==SPOTLIGHT_ZONE, //unsupported
                spotlight: toZone==SPOTLIGHT_ZONE ? this.nickname : undefined,
            }),
        }))
    }

    handleHello(msg: HelloSuccessResp) {
        this.state = msg.roomState
        this.readonly = msg.readonly
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
            } else if (k.substring(0,10)=='spotlight:') {
                const card = k.substring(10)
                this.spotlights[card] = msg.roomState[k]
            }
        }
        if (msg.roomState.nro) {
            this.numberReadonly = Number(msg.roomState.nro)
        }
        if (msg.roomState.mirobridge == this.clientId) {
            this.isMirobridge = true
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
                if (change.key.substring(0,10)=='spotlight:') {
                    const card = change.key.substring(10)
                    if (change.value) {
                        this.spotlights[card] = change.value
                    } else {
                        delete this.spotlights[card]
                    }
                }
                if (change.key=='nro') {
                    if (change.value) {
                        this.numberReadonly = Number(change.value)
                    } else {
                        this.numberReadonly = 0
                    }
                }
                if (change.key=='mirobridge') {
                    this.isMirobridge = (change.value == this.clientId)
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
    miroStarted = false
    checkMiroAfterMessage() {
        let _this = this
        if (!this.miroStarted) {
            this.miroStarted = true
            this.miro.board.ui.on('items:create', 
                (ev:ItemsCreateEvent) => _this.syncMiro())
            this.miro.board.ui.on('items:delete', 
                (ev:ItemsDeleteEvent) => _this.syncMiro())
            this.miro.board.ui.on('experimental:items:update', 
                (ev:ItemsUpdateEvent) => _this.syncMiro())
            this.syncMiro()
        }
    }
    async getMiroSnapshot(): Promise<SnapshotInfo> {
        const data: any = await this.miro.board.getInfo()
        data.widgets = (await this.miro.board.get()).filter((widget) => widget.type !== 'image' || widget.url || widget.title)
        data.widgets.forEach((w) => {if (w.modifiedAt && (w.modifiedAt as string).localeCompare(data.updatedAt)>0) { data.updatedAt = w.modifiedAt }})
        let info: SnapshotInfo = getSnapshotInfoFromMiroData(data)
        //console.log(`got miro board info:`, info)
        return info
    }
    async syncMiro() : Promise<void> {
        let info = await this.getMiroSnapshot()
        let changes = getChangesFromMiroState(info, this.state)
        if (changes.length>0) {
            console.log(`Sync miro -> changes`, changes)
            let msg:ChangeReq = {
                type: MESSAGE_TYPE.CHANGE_REQ,
                roomChanges: changes,
                echo: true,
            }
            this.ws.send(JSON.stringify(msg))
        }
    }
    async moveCardsInMiro(cards:string[], from:string, to:string) : Promise<void> {
        console.log(`move cards ${cards} in miro from ${from} -> ${to}`)
        let changed = false
        let info = await this.getMiroSnapshot()
        let allZones = info.boards.flatMap((b) => b.zones)
        let fromZone = allZones.filter((z) => z.id==from)
        let toZone = allZones.filter((z) => z.id==to)
        if (fromZone.length==0) {
            console.log(`error: cannot find from zone ${from}`)
            return
        } else if (fromZone.length>1) {
            console.log(`warning: from zone ${from} is ambiguous`)
        }
        if (toZone.length==0) {
            console.log(`error: cannot find to zone ${to}`)
            return
        } else if (toZone.length>1) {
            console.log(`warning: to zone ${to} is ambiguous`)
        }
        if (!toZone[0].nativeId) {
            console.log(`error: to zone ${to} has not native ID`)
            return
        }
        let toShape
        try {
            toShape = await this.miro.board.getById(toZone[0].nativeId)
        } catch(err) {
            console.log(`error: could not get to zone ${to} = miro ID ${toZone[0].nativeId}`)
        }
        //console.log(`to zone miro`, toShape)
        // look for cards in from zone
        let allCards = info.boards.flatMap((b)=>b.cards)
        for (let cardId of cards) {
            let matches = allCards.filter((ci)=> ci.id==cardId && ci.nativeId && ci.zones.find((cz) => cz.zoneId==from && cz.overlap>=0.5))
            if (matches.length==0) {
                console.log(`error: could not find card ${cardId} in zone ${from}`)
                continue
            } else if (matches.length>1) {
                console.log(`warning: ambiguous card ${cardId} in zone ${from}`)
            }
            console.log(`card ${cardId} is ${from} = miro image ID ${matches[0].nativeId}`)
            try {
                let image = await this.miro.board.getById(matches[0].nativeId)
                //console.log(`card/image`, image)
                // TODO - organise them more?
                let xborder = Math.max(0, toShape.width - image.width)
                let yborder = Math.max(0, toShape.height - image.height)
                image.x = toShape.x + xborder*(Math.random()-0.5)
                image.y = toShape.y + yborder*(Math.random()-0.5)
                image.relativeTo = toShape.relativeTo
                image.parentId = toShape.parentId
                await image.sync()
                await image.bringToFront()
                changed = true
            }
            catch (err) {
                console.log(`error: could not getcard ${cardId} in ${from} = miro image ID ${matches[0].nativeId}: ${err.msg}`)
                continue
            }
        }
        if (changed) 
            this.syncMiro()
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