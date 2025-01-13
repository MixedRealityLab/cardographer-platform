import {wss, type SSWebSocket, type WSS, MESSAGE_TYPE, type HelloReq, type KVStore, type RoomInfo, type ActionReq, type ActionResp, type RoomClientInfo, type ChangeReq, type ChangeNotif } from '@cgreenhalgh/websocket-room-server'
import {getDb} from '$lib/db'
import type { Session, SessionSnapshot } from '$lib/types'
import {error} from "@sveltejs/kit";
import {checkUserToken, getCookieName} from '$lib/security';
import {parse} from "cookie";
import { getClient } from './clients';

console.log(`customise websocket server`)

const MYPROTOCOL = "cardographer:2"

// handle new client...
wss.onHelloReq = async function (wss: WSS, req: HelloReq, clientId: string, sws: SSWebSocket) : Promise<{ clientState: KVStore, readonly: boolean } > {
    console.log(`on hello for ${clientId} in room ${req.roomId} with protocol ${req.roomProtocol}`)
    if (req.roomProtocol !== MYPROTOCOL) {
        throw new Error(`wrong room protocol (${req.roomProtocol} vs ${MYPROTOCOL})`)
    }
    const db = await getDb()
	const session = await db.collection<Session>('Sessions').findOne({_id: req.roomId})
	if (!session || !session.isLive) {
		throw error(404, `Session ${req.roomId} not found`)
	}
    if (session.joiningCode && req.roomCredential == session.joiningCode) {
        // rw access OK
    } else if (session.joiningCodeReadonly && req.roomCredential == session.joiningCodeReadonly) {
        if (!req.readonly) {
            console.log(`Note, client ${clientId} forced readonly by joining code`)
            req.readonly = true
        }
    }
    else {
		throw error(403, `Session ${req.roomId} authentication failed`)
    }

    const cookies = parse(sws.cookies || '');
    const userToken = cookies[getCookieName()] || '';
    const token = await checkUserToken(userToken);

    console.log(`New ${req.readonly ? 'readonly ': ''}client ${clientId} in session ${session.name} (${session._id}), ${token.valid ? 'authenticated as '+token.email :'unauthenticated'}`)
    // owner?
    let clientState = req.clientState
    if (token.valid && session.owners.indexOf(token.email) >= 0) {
        clientState.isOwner = 'true'
        await initialiseRoomState(wss, session, token.email)
    } else {
        delete clientState.isOwner
    }
    return {
        clientState,
        readonly: !!req.readonly,
    }
}

async function initialiseRoomState(wss:WSS, session:Session, owner:string) : Promise<void> {
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
    //console.log(`snapshots`, snapshots)
    if (snapshots.length==0) {
        console.log(`Warning: no snapshot exists for this session`)
        // TODO...
        return
    }
    const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots')
    .findOne({_id: snapshots[0]._id, })
    if (!snapshot) {
        console.log(`Error: could not most recent snapshot (${snapshots[0]._id})`)
        return
    }
	const client = getClient(snapshot.sessionType)
    if (!client) {
        console.log(`Error: cannot find client for sessionType ${snapshot.sessionType}`)
        return
    }
	const info = client.getSnapshotInfo(snapshot)
    let seats : string[] = []
    for (const board of info.boards) {
        //console.log(`- board ${board.id}`)
        if (board.id && board.id.indexOf('@')>=0) {
            const seat = board.id.substring(board.id.indexOf('@'))
            if (seats.indexOf(seat)<0) {
                seats.push(seat)
            }
        }
        for (const zone of board.zones) {
            //console.log(`  - zone ${zone.id}`)
            if (zone.id && zone.id.indexOf('@')>=0) {
                const seat = zone.id.substring(zone.id.indexOf('@'))
                if (seats.indexOf(seat)<0) {
                    seats.push(seat)
                }    
            }
        }
    }
    //console.log(`Seats: ${seats}`)
    let room: RoomInfo = wss.rooms[session._id]
    if (!room) {
        console.log(`creating room ${session._id} (cardographer)`)
        room = {
            id: session._id,
            clients: {},
            state: {},
        }
        wss.rooms[session._id] = room
    }
    room.state.seats = JSON.stringify(seats)
    let change:ChangeNotif = {
        type: MESSAGE_TYPE.CHANGE_NOTIF,
        roomChanges: [{key: 'seats', value: room.state.seats}]
    }
    wss.broadcastChange(session._id, change)
}

wss.onChangeReq = async function(wss:WSS, req:ChangeReq, room:RoomInfo, clientId:string, clientInfo:RoomClientInfo) : Promise< { roomChanges?: KVSet[], clientChanges?: KVSet[], echo?: boolean } > {
    console.log(`vet room changes ${JSON.stringify(req.roomChanges)} & client changes ${JSON.stringify(req.clientChanges)} for ${clientId}`)
    // TODO...?
    return {
        roomChanges: req.roomChanges,
        clientChanges: req.clientChanges,
        echo: !!req.echo,
    }
}
wss.onActionReq = async function(wss:WSS, req:ActionReq, room:RoomInfo, clientId:string, clientInfo:RoomClientInfo) : Promise< ActionResp > {
    console.log(`Action ${req.action}(${req.data}) by ${clientId}`)
    if (req.action == 'test') {
        return {
            type: MESSAGE_TYPE.ACTION_RESP,
            id: req.id,
            success: true,
            data: req.data,
            // msg: 'error...'
        }
    }
}

export async function getWss() : Promise<WSS> {
    return wss
}
