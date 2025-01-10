import {wss, type WSS, MESSAGE_TYPE, type HelloReq, type KVStore, type ChangeReq, type RoomInfo, type ActionReq, type ActionResp, type RoomClientInfo } from '@cgreenhalgh/websocket-room-server'
import {getDb} from '$lib/db'
import type { Session } from '$lib/types'
import {error} from "@sveltejs/kit";

console.log(`customise websocket server`)

const MYPROTOCOL = "cardographer:2"

// handle new client...
wss.onHelloReq = async function (wss: WSS, req: HelloReq, clientId: string) : Promise<{ clientState: KVStore, readonly: boolean } > {
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
    console.log(`New ${req.readonly ? 'readonly ': ''}client ${clientId} in session ${session.name} (${session._id})`)
    // TODO...?
    return {
        clientState: req.clientState,
        readonly: !!req.readonly,
    }
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
