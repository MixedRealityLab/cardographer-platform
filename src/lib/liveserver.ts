import {getDb} from '$lib/db'
import type {KVSet} from "$lib/liveclienttypes";
import {checkUserToken, getCookieName} from '$lib/security';
import type {Session, SessionSnapshot} from '$lib/types'
import {
	type ActionReq,
	type ActionResp,
	type ChangeNotif,
	type ChangeReq,
	type HelloReq,
	type KVStore,
	MESSAGE_TYPE,
	type RoomClientInfo,
	type RoomInfo,
	type SSWebSocket,
	wss,
	type WSS
} from '@cgreenhalgh/websocket-room-server'
import {error} from "@sveltejs/kit";
import {parse} from "cookie";
import {getClient} from './clients';
import {getChangesFromMiroState} from './liveutils';

const MYPROTOCOL = "cardographer:2"

const debug = false
const chatty = false
const inform = true

if (inform) console.log(`customise websocket server`)

interface PendingMove {
	id: string
	bridge: string
	time: number
}

interface MyRoomInfo extends RoomInfo {
	pendingMoves?: PendingMove[]
}

//wss.debug = true
// handle new client...
wss.onHelloReq = async function (wss: WSS, req: HelloReq, clientId: string, sws: SSWebSocket): Promise<{
	clientState: KVStore,
	readonly: boolean
}> {
	if (debug) console.log(`on hello for ${clientId} in room ${req.roomId} with protocol ${req.roomProtocol}`)
	if (req.roomProtocol !== MYPROTOCOL) {
		throw new Error(`wrong room protocol (${req.roomProtocol} vs ${MYPROTOCOL})`)
	}
	const db = await getDb()
	const session = await db.collection<Session>('Sessions').findOne({_id: req.roomId})
	if (!session || !session.isLive) {
		throw error(404, `Session ${req.roomId} not found`)
	}
	let readonly = !!req.readonly
	if (session.joiningCode && req.roomCredential == session.joiningCode) {
		// rw access OK
	} else if (session.joiningCodeReadonly && req.roomCredential == session.joiningCodeReadonly) {
		if (!readonly) {
			if (chatty) console.log(`Note, client ${clientId} forced readonly by joining code`)
			readonly = true
		}
	} else {
		throw error(403, `Session ${req.roomId} authentication failed`)
	}

	const cookies = parse(sws.cookies || '');
	const userToken = cookies[getCookieName()] || '';
	const token = await checkUserToken(userToken);

	if (chatty) console.log(`New ${readonly ? 'readonly ' : ''}client ${clientId} in session ${session.name} (${session._id}), ${token.valid ? 'authenticated as ' + token.email : 'unauthenticated'}`)
	// make room if not exists
	let room: RoomInfo = wss.rooms[session._id]
	if (!room) {
		await initialiseRoomState(wss, session, token.email)
		room = wss.rooms[session._id]
	}
	// owner?
	let clientState = req.clientState
	if (token.valid && session.owners.indexOf(token.email) >= 0) {
		clientState.isOwner = 'true'
	} else {
		delete clientState.isOwner
	}
	// other updates?
	if (room) {
		let change: ChangeNotif = {
			type: MESSAGE_TYPE.CHANGE_NOTIF,
			roomChanges: []
		}
		// name matches empty seat?
		const nickname = clientState['nickname']
		if (!readonly && nickname) {
			if (room.state['seats']) {
				const seats: string[] = JSON.parse(room.state['seats']) as string[]
				let ix = seats.indexOf(nickname)
				if (ix < 0) { ix = seats.indexOf('@' + nickname) }
				if (ix >= 0) {
					const seat = seats[ix]
					let player = room.state[`player:${seat}`]
					if (!player || player == '') {
						if (chatty) console.log(`allocate new player ${nickname} to seat ${seat}`)
						room.state[`player:${seat}`] = clientId
						change.roomChanges.push({key: `player:${seat}`, value: clientId})
					}
				}
			}
		}
		// count readers (this client is added to clients after return so +1)
		const numberReadonly = Object.values(room.clients).filter((c) => c.readonly).length + (readonly ? 1 : 0)
		const nro = `${numberReadonly}`
		if (room.state['nro'] != nro) {
			change.roomChanges.push({key: 'nro', value: nro})
		}
		// miro bridge?
		if (clientState.isOwner && clientState.inmiro == 'true') {
			room.state['mirobridge'] = clientId
			change.roomChanges.push({key: 'mirobridge', value: clientId})
		}
		if (change.roomChanges.length > 0) {
			wss.broadcastChange(room, change)
		}
	}
	return {
		clientState,
		readonly,
	}
}

async function initialiseRoomState(wss: WSS, session: Session, _owner: string): Promise<void> {
	// find latest snapshot of session
	const db = await getDb()
	let snapshots = await db.collection<SessionSnapshot>('SessionSnapshots')
		.find({
			sessionId: session._id, //owners: owner
		}, {
			projection: {
				_id: true, sessionId: true,
				created: true, originallyCreated: true,
				snapshotDescription: true,
			}
		})
		.sort({created: -1})
		.toArray()
	//console.log(`${snapshots.length} snapshots for session ${session._id}`, snapshots)
	if (snapshots.length == 0) {
		if (chatty) console.log(`Warning: no snapshot exists for this session`)
		// TODO...
		return
	}
	const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots')
		.findOne({_id: snapshots[0]._id,})
	if (!snapshot) {
		console.log(`Error: could not find most recent snapshot (${snapshots[0]._id}) for room/session ${session._id}`)
		return
	}
	const client = getClient(snapshot.sessionType)
	if (!client) {
		if (debug) console.log(`Error: cannot find client for sessionType ${snapshot.sessionType}`)
		return
	}
	if (inform) console.log(`init live room/session ${session._id} from snapshot ${snapshots[0]._id} created ${snapshot.created} (originally ${snapshot.originallyCreated})`)
	const info = client.getSnapshotInfo(snapshot)
	//console.log(`Seats: ${seats}`)
	let room: RoomInfo = wss.rooms[session._id]
	if (!room) {
		if (chatty) console.log(`creating room ${session._id} (cardographer)`)
		room = {
			id: session._id,
			clients: {},
			state: {},
		}
		wss.rooms[session._id] = room
	}
	// change...
	let change: ChangeNotif = {
		type: MESSAGE_TYPE.CHANGE_NOTIF,
		roomChanges: getChangesFromMiroState(info, room.state)
	}
	// update room state
	for (const rc of change.roomChanges) {
		if (rc.value !== undefined) {
			room.state[rc.key] = rc.value
		} else {
			delete room.state[rc.key]
		}
	}
	//console.log(`initialised room ${session._id} state`, room.state)
	wss.broadcastChange(room, change)
}

interface ChangeSeatReq {
	player: String
	seat: string
}

interface ChangeBoardReq {
	board: String
}

interface MoveCardsReq {
	from: string
	to: string
	cards: string[]
	//autoReturn?:boolean // move back if client deleted ?!
	spotlight?: string
}

wss.onChangeReq = async function (wss: WSS, req: ChangeReq, room: RoomInfo, clientId: string, _clientInfo: RoomClientInfo): Promise<{
	roomChanges?: KVSet[],
	clientChanges?: KVSet[],
	echo?: boolean
}> {
	//console.log(`vet room changes ${JSON.stringify(req.roomChanges)} & client changes ${JSON.stringify(req.clientChanges)} for ${clientId}`)
	if (req.roomChanges && req.roomChanges.length > 0) {
		// only mirobridge can make changes
		if (room.state['mirobridge'] != clientId) {
			if (debug) console.log(`reject changes from non-mirobridge ${clientId}`)
			req.roomChanges = []
		} else {
			if (chatty) console.log(`room changes from mirobridge ${clientId}`)
		}
	}
	return {
		roomChanges: req.roomChanges,
		clientChanges: req.clientChanges,
		echo: !!req.echo,
	}
}
wss.onActionReq = async function (wss: WSS, req: ActionReq, room: RoomInfo, clientId: string, clientInfo: RoomClientInfo): Promise<ActionResp> {
	if (debug) console.log(`Action ${req.action}(${req.data}) by ${clientId}`)
	let error: string | null = null
	if (req.action == 'test') {
		return {
			type: MESSAGE_TYPE.ACTION_RESP,
			id: req.id,
			success: true,
			data: req.data,
			// msg: 'error...'
		}
	} else if (req.action == 'changeSeat') {
		const move = JSON.parse(req.data) as ChangeSeatReq
		if (typeof (move.player) !== 'string' || typeof (move.seat) !== 'string') {
			throw new Error(`invalid changeSeat data`)
		}
		if (clientInfo.clientState['isOwner'] != 'true') {
			return {
				type: MESSAGE_TYPE.ACTION_RESP,
				id: req.id,
				success: false,
				msg: `non-owner cannot request changeSeat`
			}
		}
		let change: ChangeNotif = {
			type: MESSAGE_TYPE.CHANGE_NOTIF,
			roomChanges: [],
		}
		// already in a seat?
		for (const key of Object.keys(room.state)) {
			if (key.substring(0, 7) == 'player:') {
				const seat = key.substring(7)
				if (room.state[key] == move.player && seat != move.seat) {
					delete room.state[key]
					change.roomChanges.push({key})
					if (chatty) console.log(`player ${move.player} has to leave seat ${seat}`)
				}
			}
		}
		const key = `player:${move.seat}`
		if (room.state[key] !== move.player) {
			room.state[key] = move.player
			change.roomChanges.push({key, value: move.player})
			if (chatty) console.log(`player ${move.player} moved to seat ${move.seat}`)
		} else {
			if (chatty) console.log(`player ${move.player} already in seat ${move.seat}`)
		}
		if (change.roomChanges.length > 0) {
			wss.broadcastChange(room, change)
		}
	} else if (req.action == 'changeBoard') {
		const move = JSON.parse(req.data) as ChangeBoardReq
		if (typeof (move.board) !== 'string') {
			throw new Error(`invalid changeBoard data`)
		}
		if (clientInfo.clientState['isOwner'] != 'true') {
			return {
				type: MESSAGE_TYPE.ACTION_RESP,
				id: req.id,
				success: false,
				msg: `non-owner cannot request changeBoard`
			}
		}
		let change: ChangeNotif = {
			type: MESSAGE_TYPE.CHANGE_NOTIF,
			roomChanges: [],
		}
		if (room.state.activeBoard != move.board && move.board) {
			room.state.activeBoard = move.board
			change.roomChanges.push({key: 'activeBoard', value: move.board})
			if (chatty) console.log(`board changed to ${move.board}`)
		}
		if (change.roomChanges.length > 0) {
			wss.broadcastChange(room, change)
		}
	} else if (req.action == 'moveCards') {
		const move = JSON.parse(req.data) as MoveCardsReq
		if (typeof (move.from) !== 'string'
			|| typeof (move.to) !== 'string'
			|| !Array.isArray(move.cards)
			|| (move.spotlight && typeof (move.spotlight) !== 'string')) {
			throw new Error(`invalid moveCards data`)
		}
		if (clientInfo.readonly) {
			return {
				type: MESSAGE_TYPE.ACTION_RESP,
				id: req.id,
				success: false,
				msg: `readonly client cannot request moveCards`
			}
		}
		let change: ChangeNotif = {
			type: MESSAGE_TYPE.CHANGE_NOTIF,
			roomChanges: [],
		}
		// confirm cards that are in the from zone
		let fromCards = JSON.parse(room.state[`cards:${move.from}`] ?? "[]")
		let toCards = JSON.parse(room.state[`cards:${move.to}`] ?? "[]")
		let moveCards = fromCards.filter((c) => move.cards.indexOf(c) >= 0)
		if (move.spotlight) {
			for (const card of moveCards) {
				room.state[`spotlight:${card}`] = move.spotlight
				change.roomChanges.push({key: `spotlight:${card}`, value: move.spotlight})
			}
		} else {
			for (const card of moveCards) {
				if (room.state[`spotlight:${card}`]) {
					delete room.state[`spotlight:${card}`]
					change.roomChanges.push({key: `spotlight:${card}`})
				}
			}
		}
		if (moveCards.length == 0) {
			if (chatty) console.log(`none of the cards ${move.cards} found in ${move.from}`)
		} else if (room.state['mirobridge'] && room.clients[room.state['mirobridge']]) {
			// ask mirobridge to actually move the cards?!
			const mirobridge = room.clients[room.state['mirobridge']]
			let breq: ActionReq = {
				type: MESSAGE_TYPE.ACTION_REQ,
				id: req.id,
				action: 'moveCardsInMiro',
				data: JSON.stringify({from: move.from, to: move.to, cards: moveCards})
			}
			try {
				mirobridge.ws.send(JSON.stringify(breq))
				let myRoom = room as MyRoomInfo
				if (!myRoom.pendingMoves) {
					myRoom.pendingMoves = []
				}
				myRoom.pendingMoves.push({id: req.id, bridge: room.state['mirobridge'], time: Date.now()})
				// fiddle request ID to suppress client completion
				req.id = `delegated:${req.id}`
			} catch (err) {
				if (inform) console.log(`Error passing moveCards to mirobridge ${clientId}: ${err.msg}`)
			}
		} else {
			room.state[`cards:${move.from}`] = JSON.stringify(fromCards.filter((c) => move.cards.indexOf(c) < 0))
			toCards = toCards.concat(moveCards).filter(function (el, i, a) {return i === a.indexOf(el)})
			room.state[`cards:${move.to}`] = JSON.stringify(toCards)
			change.roomChanges.push({key: `cards:${move.from}`, value: room.state[`cards:${move.from}`]})
			change.roomChanges.push({key: `cards:${move.to}`, value: room.state[`cards:${move.to}`]})
		}
		if (change.roomChanges.length > 0) {
			wss.broadcastChange(room, change)
		}
	} else if (req.action == 'movedCardsInMiro' && req.id) {
		if (debug) console.log(`received movedCardsInMiro ${req.id}`)
		// @ts-ignore
		replyPendingMove(room, req.id, req.data == 'true', req.msg)
	} else {
		error = `unsupported action ${req.action}`
	}
	return {
		type: MESSAGE_TYPE.ACTION_RESP,
		id: req.id,
		success: !error,
		msg: error
	}
}

function replyPendingMove(room: RoomInfo, id: string, success: boolean, msg?: string) {
	let myRoom = room as MyRoomInfo
	if (myRoom.pendingMoves) {
		let pMoveIndex = myRoom.pendingMoves.findIndex((p) => p.id == id)
		if (pMoveIndex >= 0) {
			myRoom.pendingMoves.splice(myRoom.pendingMoves.findIndex((p) => p.id == id), 1)
		} else {
			if (debug) console.log(`could not find pending move on reply ${id}`)
		}
	}
	let clientId = id
	let lix = clientId.lastIndexOf(':')
	if (lix >= 0) {
		clientId = clientId.substring(0, lix)
	}
	let client = room.clients[clientId]
	if (client) {
		let resp: ActionResp = {
			type: MESSAGE_TYPE.ACTION_RESP,
			id: id,
			success,
			msg,
		}
		if (debug) console.log(`reply cardMoveInMiro response to ${clientId}`)
		client.ws.send(JSON.stringify(resp))
	} else {
		if (debug) console.log(`Error: could not find card moving client ${clientId} for reply`)
	}
}

wss.onLeave = async function (wss: WSS, room: RoomInfo, clientId: string, clientInfo: RoomClientInfo) {
	//console.log(`handle client ${clientId} left room ${room.id} (${JSON.stringify(clientInfo.clientState)})`)
	let change: ChangeNotif = {
		type: MESSAGE_TYPE.CHANGE_NOTIF,
		roomChanges: []
	}
	// was player in a seat? clear it, offer to new player if same nickname or slot
	for (const key of Object.keys(room.state)) {
		if (key.substring(0, 7) == 'player:') {
			const player = room.state[key]
			if (player == clientId) {
				const seat = key.substring(7)
				if (chatty) console.log(`player ${clientId} leaves vacating seat ${seat}`)
				const oldNickname = clientInfo.clientState['nickname']
				let newClient: string | null = null
				let newNickname: string | null = null
				for (const clientId of Object.keys(room.clients)) {
					const client = room.clients[clientId]
					if (client.readonly)
						continue
					const nickname = client.clientState['nickname']
					if (nickname && (nickname == oldNickname
						|| ((nickname == seat || '@' + nickname == seat) && newNickname != oldNickname))) {
						newNickname = nickname
						newClient = clientId
					}
				}
				if (newClient) {
					if (chatty) console.log(`allocate existing player ${newNickname} to seat ${seat}`)
					room.state[`player:${seat}`] = newClient
				} else {
					room.state[`player:${seat}`] = ''
				}
				change.roomChanges.push({key: `player:${seat}`, value: room.state[`player:${seat}`]})
			}
		}
	}
	// count readers (this client has been removed already)
	const numberReadonly = Object.values(room.clients).filter((c) => c.readonly).length
	const nro = `${numberReadonly}`
	if (room.state['nro'] != nro) {
		change.roomChanges.push({key: 'nro', value: nro})
	}
	// was client mirobridge?
	if (room.state['mirobridge'] == clientId) {
		delete room.state['mirobridge']
		// alternative miro bridge?
		for (const cid of Object.keys(room.clients)) {
			const client = room.clients[cid]
			if (client.clientState.isOwner && client.clientState.inmiro == 'true' && !room.state['mirobridge']) {
				room.state['mirobridge'] = cid
			}
		}
		change.roomChanges.push({key: 'mirobridge', value: room.state['mirobridge']})
	}
	// were there any pending moves
	let myroom = room as MyRoomInfo
	let pms = (myroom.pendingMoves ?? []).filter((pm) => pm.bridge == clientId)
	for (let pm of pms) {
		if (debug) console.log(`abandon pending move ${pm.id} on bridge leave`)
		replyPendingMove(room, pm.id, false, 'bridge left before replying')
	}
	myroom.pendingMoves = (myroom.pendingMoves ?? []).filter((pm) => pm.bridge != clientId)
	if (change.roomChanges.length > 0) {
		wss.broadcastChange(room, change)
	}
	if (Object.keys(room.clients).length == 0) {
		if (inform) console.log(`room ${room.id} is now empty - deleting it`)
		delete wss.rooms[room.id]
	}
}

export async function getWss(): Promise<WSS> {
	return wss
}

export async function checkNewSnapshot(snapshot: SessionSnapshot): Promise<void> {
	if (debug) console.log(`check new snapshot for session ${snapshot.sessionId}`)
	let room = wss.rooms[snapshot.sessionId]
	if (!room) {
		return
	}
	const client = getClient(snapshot.sessionType)
	if (!client) {
		if (debug) console.log(`Error: cannot find client for sessionType ${snapshot.sessionType}`)
		return
	}
	if (inform) console.log(`update room for session ${snapshot.sessionId} with new uploaded snapshot ${snapshot._id}`)
	const info = client.getSnapshotInfo(snapshot)
	// change...
	let change: ChangeNotif = {
		type: MESSAGE_TYPE.CHANGE_NOTIF,
		roomChanges: getChangesFromMiroState(info, room.state)
	}
	// update room state
	for (const rc of change.roomChanges) {
		if (rc.value !== undefined) {
			room.state[rc.key] = rc.value
		} else {
			delete room.state[rc.key]
		}
	}
	//console.log(`initialised room ${session._id} state`, room.state)
	wss.broadcastChange(room, change)
}