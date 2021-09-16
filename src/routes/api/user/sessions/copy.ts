import type {CopySessionRequest} from '$lib/apitypes';
import {getDb, getNewId} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Session} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function post(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	let copyreq = request.body as unknown as CopySessionRequest;
	if (!copyreq.sessid) {
		if (debug) console.log(`no sessid in copy`, copyreq);
		return {status: 400}
	}
	//if (debug) console.log(`add session`, copyreq);
	const db = await getDb();
	// new deck id
	const newid = getNewId();
	//const revId = 1;
	const oldSessionId = copyreq.sessid;
	const now = new Date().toISOString();
	// existing local session...
	const session = await db.collection<Session>('Sessions').findOne({
		_id: oldSessionId
	})
	// check permissions
	if (!session) {
		if (debug) console.log(`cannot copy unknown session ${oldSessionId}`);
		return {status: 400};
	}
	if (!session.isPublic &&
		(!session.owners || session.owners.indexOf(locals.email) < 0)) {
		if (debug) console.log(`cannot copy private session ${session._id} from ${session.owners}`);
		return {status: 403};
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
	let result = await db.collection<Session>('Sessions').insertOne(session);
	if (!result.acknowledged) {
		console.log(`Error adding new session ${newid}`);
		return {status: 500};
	}
	console.log(`added session ${newid}`);

	return {
		body: {
			sessid: newid
		}
	}
}
  
