// live view client utils - NB needs to work in browser so using copies of types :-(
import type {ItemsCreateEvent, ItemsDeleteEvent, ItemsUpdateEvent, Miro} from "@mirohq/websdk-types"
import type {WidgetMixin} from "@mirohq/websdk-types/core/api/common"
import {type SnapshotInfo} from './analysistypes'
import {getSnapshotInfoFromMiroData} from './clients/miroutils'
import {
	type ActionReq,
	type ActionResp,
	type ChangeNotif,
	type ChangeReq,
	type ClientInfo,
	type HelloSuccessResp,
	type KVSet,
	type KVStore,
	MESSAGE_TYPE
} from './liveclienttypes'
import {getChangesFromMiroState} from './liveutils';
import {type Session} from './types'

export const SPOTLIGHT_ZONE = "Spotlight"

export enum LIVE_CLIENT_STATUS {
	WAITING_FOR_HELLO,
	ACTIVE,
}

export interface ClientItem extends ClientInfo {
	clientId: string
}

let liveClient: LiveClient

export function getLiveClient(cb: UpdateCallback) {
	if (!liveClient) {
		liveClient = new LiveClient(cb)
	} else {
		liveClient.updateCallback = cb
	}
	return liveClient
}

type UpdateCallback = (c: LiveClient, clientsChanged: boolean) => void

interface ZoneCardMap {
	[zone: string]: string[]
}

interface BoardZoneMap {
	[board: string]: string[]
}

interface PlayerMap {
	[seat: string]: string // connection
}

interface SpotlightMap {
	[cardId: string]: string // text, e.g. nickname
}

interface MoveCardsInMiroReq {
	from: string
	to: string
	cards: string[]
}

export class LiveClient {
	state: KVStore = {}
	clients: ClientItem[] = []
	clientId: string
	seats: string[] = []
	status: LIVE_CLIENT_STATUS = LIVE_CLIENT_STATUS.WAITING_FOR_HELLO
	ws: WebSocket | null = null
	players: PlayerMap = {} // players[seat] = clientId
	connecting = false
	failed: string | null = null
	connected = false
	updateCallback: UpdateCallback | null = null
	activeBoard: string | null
	boards: string[] = []
	zones: BoardZoneMap = {}
	activeZones: string[] = []
	zoneCards: ZoneCardMap = {}
	nickname: string = 'anon'
	spotlights: SpotlightMap = {}
	readonly: boolean
	numberReadonly: number = 0
	isMirobridge: boolean = false
	miro: Miro
	nextMove = 1
	pendingMoves: string[] = []

	constructor(cb: UpdateCallback) {
		this.updateCallback = cb
	}

	updated(clientsChanged: boolean) {
		if (this.updateCallback) {
			this.updateCallback(this, clientsChanged)
		}
	}

	connect(url: URL, base: string, session: Session, nickname: string, joiningCode: string, miro: Miro | null) {
		let _this = this
		this.nickname = nickname
		this.miro = miro
		if (this.ws) {
			console.log(`liveClient already has websocket; close and re-connect...`)
			try {
				this.ws.close()
			} catch (err) { /* ignore */ }
		}
		const wsurl = `${url.protocol == 'https:' ? 'wss' : 'ws'}://${url.host}/${base}wss`
		console.log(`connect to ${wsurl}...`)
		this.connecting = true
		this.updated(false)
		this.ws = new WebSocket(wsurl)
		this.ws.onerror = (event) => {
			console.log(`ws error`, event)
			// @ts-ignore
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
					&& _this.state['mirobridge'] == _this.clientId) {
					let data = JSON.parse(action.data) as MoveCardsInMiroReq
					_this.moveCardsInMiroAndReply(data.cards, data.from, data.to, action.id)
				} else {
					console.log(`ignored action request ${action.action}`)
				}
			} else if (msg.type == MESSAGE_TYPE.ACTION_RESP) {
				let resp = msg as ActionResp
				if (resp.id && this.pendingMoves.indexOf(resp.id) >= 0) {
					this.pendingMoves.splice(this.pendingMoves.indexOf(resp.id), 1)
				}
			}
			//console.log(`clients:`, _this.getClients())
			_this.updated(clientsChanged)
			if (_this.isMirobridge) {
				_this.checkMiroAfterMessage()
			}
		}
		this.ws.onopen = (_event) => {
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
				clientState: {nickname, inmiro: `${miro != null}`}
				//readonly?: boolean // default true
			}
			_this.ws.send(JSON.stringify(helloReq))
		}
		_this.updated(false)
	}

	close() {
		if (this.ws) {
			console.log(`close websocket on destroy`)
			this.ws.close()
			this.ws = null
		}
		this.connected = false
		this.updated(false)
	}

	changeSeat(seat: string, player: string) {
		console.log(`change seat ${seat} -> ${player}...`)
		this.ws.send(JSON.stringify({
			type: MESSAGE_TYPE.ACTION_REQ,
			action: 'changeSeat',
			data: JSON.stringify({seat, player}),
		}))
	}

	changeBoard = (board: string) => {
		console.log(`change board -> ${board}...`)
		this.ws.send(JSON.stringify({
			type: MESSAGE_TYPE.ACTION_REQ,
			action: 'changeBoard',
			data: JSON.stringify({board}),
		}))
	}

	moveCards(cardIds: string[], fromZone: string, toZone: string) {
		console.log(`move cards ${cardIds} from ${fromZone} to ${toZone} (${this.nextMove})`)
		let move = `${this.clientId}:${this.nextMove++}`
		this.pendingMoves.push(move)
		this.ws.send(JSON.stringify({
			type: MESSAGE_TYPE.ACTION_REQ,
			action: 'moveCards',
			id: move,
			data: JSON.stringify({
				cards: cardIds,
				from: fromZone,
				to: toZone,
				//autoReturn: toZone==SPOTLIGHT_ZONE, //unsupported
				spotlight: toZone.split('/')[1] == SPOTLIGHT_ZONE ? this.nickname : undefined,
			}),
		}))
	}

	handleHello(msg: HelloSuccessResp) {
		this.state = msg.roomState
		this.readonly = msg.readonly
		this.clients = []
		for (const clientId in msg.clients) {
			this.clients.push({clientId, ...msg.clients[clientId]})
		}
		this.clientId = msg.clientId
		if (msg.roomState.seats) {
			this.seats = JSON.parse(msg.roomState.seats) as string[]
		}
		this.activeBoard = msg.roomState.activeBoard
		if (msg.roomState.boards) {
			this.boards = JSON.parse(msg.roomState.boards) as string[]
		}
		for (const k of Object.keys(msg.roomState)) {
			if (k.substring(0, 6) == 'cards:') {
				const zone = k.substring(6)
				this.zoneCards[zone] = JSON.parse(msg.roomState[k])
			} else if (k.substring(0, 7) == 'player:') {
				const seat = k.substring(7)
				this.players[seat] = msg.roomState[k]
			} else if (k.substring(0, 10) == 'spotlight:') {
				const card = k.substring(10)
				this.spotlights[card] = msg.roomState[k]
			} else if (k.substring(0, 6) == 'zones:') {
				const board = k.substring(6)
				this.zones[board] = JSON.parse(msg.roomState[k])
			}
		}
		if (msg.roomState.nro) {
			this.numberReadonly = Number(msg.roomState.nro)
		}
		if (msg.roomState.mirobridge == this.clientId) {
			this.isMirobridge = true
		}
		if (this.activeBoard) {
			this.activeZones = this.zones[this.activeBoard] ?? []
		}
		this.status = LIVE_CLIENT_STATUS.ACTIVE
	}

	// return clients changed
	handleNotif(msg: ChangeNotif): boolean {
		let clientsChanged = false
		if (msg.roomChanges) {
			for (const change of msg.roomChanges) {
				if (change.key == 'activeBoard') {
					if (change.value) {
						this.activeBoard = change.value
					} else {
						delete this.activeBoard
					}
					clientsChanged = true
				} else if (change.key == 'boards') {
					if (change.value) {
						this.boards = JSON.parse(change.value) as string[]
					} else {
						this.boards = []
					}
				} else if (change.key == 'seats') {
					if (change.value) {
						this.seats = JSON.parse(change.value) as string[]
					} else {
						this.seats = []
					}
					clientsChanged = true
				} else if (change.key.substring(0, 6) == 'cards:') {
					const zone = change.key.substring(6)
					if (change.value) {
						this.zoneCards[zone] = JSON.parse(change.value)
					} else {
						delete this.zoneCards[zone]
					}
				} else if (change.key.substring(0, 7) == 'player:') {
					const seat = change.key.substring(7)
					if (change.value) {
						this.players[seat] = change.value
					} else {
						delete this.players[seat]
					}
				} else if (change.key.substring(0, 10) == 'spotlight:') {
					const card = change.key.substring(10)
					if (change.value) {
						this.spotlights[card] = change.value
					} else {
						delete this.spotlights[card]
					}
				} else if (change.key == 'nro') {
					if (change.value) {
						this.numberReadonly = Number(change.value)
					} else {
						this.numberReadonly = 0
					}
				} else if (change.key == 'mirobridge') {
					this.isMirobridge = (change.value == this.clientId)
				} else if (change.key.substring(0, 6) == 'zones:') {
					const board = change.key.substring(6)
					if (change.value) {
						this.zones[board] = JSON.parse(change.value)
					} else {
						delete this.zones[board]
					}
				}
			}
			if (this.activeBoard) {
				this.activeZones = this.zones[this.activeBoard] ?? []
			} else {
				this.activeZones = []
			}
		}
		applyChanges(this.state, msg.roomChanges)
		if (msg.updateClients) {
			for (const clientId in msg.updateClients) {
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
				if (ix >= 0) {
					this.clients.splice(ix, 1)
				}
			}
			clientsChanged = true
		}
		if (msg.addClients) {
			for (const clientId in msg.addClients) {
				if (this.clients.find((c) => c.clientId == clientId)) {
					console.log(`Error: ChangeNotify adds already known client ${clientId}`)
				} else {
					const req = msg.addClients[clientId]
					let client: ClientItem = {
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

	getRoomState(): KVStore {
		return this.state
	}

	getClientState(clientId: string): KVStore {
		return this.clients[clientId]?.clientState
	}

	getClients(): ClientItem[] {
		return this.clients
	}

	miroStarted = false

	checkMiroAfterMessage() {
		let _this = this
		if (!this.miroStarted) {
			this.miroStarted = true
			this.miro.board.ui.on('items:create', (_ev: ItemsCreateEvent) => _this.syncMiro())
			this.miro.board.ui.on('items:delete', (_ev: ItemsDeleteEvent) => _this.syncMiro())
			this.miro.board.ui.on('experimental:items:update', (_ev: ItemsUpdateEvent) => _this.syncMiro())
			this.syncMiro()
		}
	}

	async getMiroSnapshot(): Promise<SnapshotInfo> {
		const data: any = await this.miro.board.getInfo()
		// @ts-ignore
		data.widgets = (await this.miro.board.get()).filter((widget) => widget.type !== 'image' || widget.url || widget.title)
		data.widgets.forEach((w) => {if (w.modifiedAt && (w.modifiedAt as string).localeCompare(data.updatedAt) > 0) { data.updatedAt = w.modifiedAt }})
		//console.log(`got miro board info:`, info)
		return getSnapshotInfoFromMiroData(data)
	}

	async syncMiro(): Promise<void> {
		let info = await this.getMiroSnapshot()
		let changes = getChangesFromMiroState(info, this.state)
		if (changes.length > 0) {
			console.log(`Sync miro -> changes`, changes)
			let msg: ChangeReq = {
				type: MESSAGE_TYPE.CHANGE_REQ,
				roomChanges: changes,
				echo: true,
			}
			this.ws.send(JSON.stringify(msg))
		}
	}

	async moveCardsInMiroAndReply(cards: string[], from: string, to: string, id?: string): Promise<void> {
		let changed = await this.moveCardsInMiro(cards, from, to)
		if (this.ws) {
			let resp: ActionReq = {
				type: MESSAGE_TYPE.ACTION_REQ,
				action: 'movedCardsInMiro',
				id: id,
				data: JSON.stringify(changed),
			}
			this.ws.send(JSON.stringify(resp))
		}
	}

	async moveCardsInMiro(cards: string[], sfrom: string, sto: string): Promise<boolean> {
		console.log(`move cards ${cards} in miro from ${sfrom} -> ${sto}`)
		let changed = false
		let info = await this.getMiroSnapshot()
		let fromBoardId = sfrom.substring(0, sfrom.indexOf('/'))
		let fromZoneId = sfrom.substring(sfrom.indexOf('/') + 1)
		let fromBoards = info.boards.filter((b) => (b.id ?? b.nativeId) == fromBoardId)
		if (fromBoards.length == 0) {
			console.log(`error: cannot find from board ${fromBoardId}`)
			return false
		} else if (fromBoards.length > 1) {
			console.log(`warning: from board ${fromBoardId} is ambiguous `)
		}
		let fromZone = fromBoards.flatMap((b) => b.zones).filter((z) => z.id == fromZoneId)
		if (fromZone.length == 0) {
			console.log(`error: cannot find from zone ${sfrom}`)
			return false
		} else if (fromZone.length > 1) {
			console.log(`warning: from zone ${sfrom} is ambiguous`)
		}
		let toBoardId = sto.substring(0, sto.indexOf('/'))
		let toZoneId = sto.substring(sto.indexOf('/') + 1)
		let toBoards = info.boards.filter((b) => (b.id ?? b.nativeId) == toBoardId)
		if (toBoards.length == 0) {
			console.log(`error: cannot find to board ${toBoardId}`)
			return false
		} else if (toBoards.length > 1) {
			console.log(`warning: to board ${toBoardId} is ambiguous `)
		}
		let toZone = toBoards.flatMap((b) => b.zones).filter((z) => z.id == toZoneId)
		if (toZone.length == 0) {
			console.log(`error: cannot find to zone ${sto}`)
			return false
		} else if (toZone.length > 1) {
			console.log(`warning: to zone ${sto} is ambiguous`)
		}
		if (!toZone[0].nativeId) {
			console.log(`error: to zone ${sto} has no native ID`)
			return false
		}
		let toShape
		try {
			toShape = await this.miro.board.getById(toZone[0].nativeId)
		} catch (err) {
			console.log(`error: could not get to zone ${sto} = miro ID ${toZone[0].nativeId}`)
		}
		//console.log(`to zone miro`, toShape)
		// look for cards in from zone
		let allCards = fromBoards.flatMap((b) => b.cards)
		for (let cardId of cards) {
			let matches = allCards.filter((ci) => ci.id == cardId && ci.nativeId && ci.zones.find((cz) => cz.zoneId == fromZoneId && cz.overlap >= 0.5))
			if (matches.length == 0) {
				console.log(`error: could not find card ${cardId} in zone ${sfrom}`)
				continue
			} else if (matches.length > 1) {
				console.log(`warning: ambiguous card ${cardId} in zone ${sfrom}`)
			}
			console.log(`card ${cardId} is ${sfrom} = miro image ID ${matches[0].nativeId}`)
			try {
				changed = true
				let image = await this.miro.board.getById(matches[0].nativeId) as WidgetMixin
				// Changing parent?
				// This doesn't seem to work, failing initially on the .add to the
				// new parent (frame). But then every parent manipulation after that
				// fails too. The error doesn't seem to make sense as it implies it is
				// trying to become its own child :-(
				if (image.parentId !== toShape.parentId) {
					if (image.parentId) {
						let p1: any = await this.miro.board.getById(image.parentId)
						await p1.remove(image)
						// not sure if this helps or not...
						await p1.sync()
						// not sure if we need this either...force reverse sync
						image = await this.miro.board.getById(image.id) as WidgetMixin
					}
					// now move it into the parent
					if (toShape.parentId) {
						let p2: any = await this.miro.board.getById(toShape.parentId)
						let x = p2.x
						let y = p2.y
						let p3 = p2
						// in case there are multiple ancestors (there aren't at the moment)
						while (p3.parentId) {
							p3 = await this.miro.board.getById(p3.parentId)
							if (p3.relativeTo == 'parent_top_left') {
								x += p3.x
								y += p3.y
							} else {
								console.log(`warning: unhandled miro relativeTo ${p3.relativeTo}`)
							}
						}
						image.x = x
						image.y = y
						await image.sync()
						await p2.add(image)
						// seems to throw (e.g.) cannot set item [p2 id] as a child, because the item isn't inside a parent frame.
						// not sure if this helps...
						await p2.sync()
						// force reverse sync?
						image = await this.miro.board.getById(image.id) as WidgetMixin
					}
				}
				// TODO - organise them more?
				// @ts-ignore
				let xBorder = Math.max(0, toShape.width - image.width)
				// @ts-ignore
				let yBorder = Math.max(0, toShape.height - image.height)
				image.x = toShape.x + xBorder * (Math.random() - 0.5)
				image.y = toShape.y + yBorder * (Math.random() - 0.5)
				image.relativeTo = toShape.relativeTo
				await image.sync()
				await image.bringToFront()
			} catch (err) {
				console.log(`error: could not move miro card ${cardId} in ${sfrom} = miro image ID ${matches[0].nativeId}: ${err.msg}`, err)
			}
		}
		if (changed)
			await this.syncMiro()
		return changed
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