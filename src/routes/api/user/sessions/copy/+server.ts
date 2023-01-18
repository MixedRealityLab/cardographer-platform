import type {CopySessionRequest} from '$lib/apitypes';
import {getDb, getNewId} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {error, json as json$1} from '@sveltejs/kit';

const debug = true;

export const post: RequestHandler = async function ({locals, request}) {
	verifyAuthentication(locals)
	const copyReq = await request.json() as CopySessionRequest
	if (!copyReq.sessionId) {
		if (debug) console.log(`no sessionId in copy`, copyReq)
		throw error(400)
	}
	//if (debug) console.log(`add session`, copyreq);
	const db = await getDb();
	const newId = getNewId();
	const oldSessionId = copyReq.sessionId;
	const now = new Date().toISOString();
	// existing local session...

	let session: Session
	if (oldSessionId === 'blank') {
		session = {
			_id: newId,
			created: now,
			decks: [],
			isArchived: false,
			isPublic: false,
			isTemplate: false,
			lastModified: now,
			name: "Blank Session",
			owners: [locals.email],
			sessionType: ""
		}
	} else {
		session = await db.collection<Session>('Sessions').findOne({
			_id: oldSessionId
		})
		// check permissions
		if (!session) {
			if (debug) console.log(`cannot copy unknown session ${oldSessionId}`);
			throw error(400);
		}
		if (!session.isPublic &&
			(!session.owners || session.owners.indexOf(locals.email) < 0)) {
			if (debug) console.log(`cannot copy private session ${session._id} from ${session.owners}`);
			throw error(401);
		}
		session._id = newId
		session.name = `Copy of ${session.name}`
		session.created = session.lastModified = now
		session.owners = [locals.email]
		session.isPublic = false
		session.isTemplate = false
	}

	// add
	const result = await db.collection<Session>('Sessions').insertOne(session);
	if (!result.acknowledged) {
		console.log(`Error adding new session ${newId}`);
		throw error(500);
	}
	console.log(`added session ${newId}`);

	return json$1({
		sessionId: newId
	})
}
  
