import {getDb,getNewId} from '$lib/db.ts';
import type {Session } from '$lib/types.ts';
import type {CopySessionRequest,CopySessionResponse} from '$lib/apitypes.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function post(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	let copyreq = request.body as CopySessionRequest;
	if (!copyreq.sessid) {
		if (debug) console.log(`no sessid in copy`, copyreq);
		return { status: 400 }
	}
	//if (debug) console.log(`add session`, copyreq);
	const db = await getDb();
	// new deck id
	const newid = getNewId();
	const revid = 1;
	const oldSessionId = copyreq.sessid;
	const now = new Date().toISOString();
	// existing local session...
	const session = await db.collection('Sessions').findOne({
		_id:oldSessionId
	}) as Session;
	// check permissions
	if (!session) {
		if (debug) console.log(`cannot copy unknown session ${oldSessionId}`);
		return {status:400};
	}
	if (!session.isPublic && 
	    (!session.owners || session.owners.indexOf(locals.email)<0)) {
		if (debug) console.log(`cannot copy private session ${session._id} from ${session.owners}`);
		return {status:403};
	}
	// sanitise revision
	session._id = newid;
	session.name = `Copy of ${session.name}`;
	session.owners = [locals.email];
	session.created = session.lastModified = now;
	session.isPublic = false;
	session.isTemplate = false;
	// TODO fix board, etc.
	// TODO players -> templats?
	const oldPlayers = session.players;
	session.players = [];
	// add
	let result = await db.collection('Sessions').insertOne(session);
	if (!result.insertedCount) {
		console.log(`Error adding new session ${newid}`);
		return { status: 500 };
	}
	console.log(`added session ${newid}`);

	return {
		body: { 
			sessid: newid
		}
	}
}
  
