import {getDb,getNewId} from '$lib/db.ts';
import type {Session,SessionSnapshot } from '$lib/types.ts';
import type {ImportSessionResponse} from '$lib/apitypes.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import { guessSessionType,makeSession, makeSessionSnapshot } from '$lib/clients/index.ts';

const debug = true;


export async function post(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	let ss = request.body;
       	if (!Array.isArray(ss)) {
		ss = [ss];
	}
	//if (debug) console.log(`add session`, copyreq);
	const db = await getDb();
	const now = new Date().toISOString();
	let message = '';
	for (let si in ss) {
		let s = ss[si];
		//if(debug) console.log(`import`, s);
		if (!s._id) {
			console.log(`no _id in import session ${si} - ignored`);
			continue;
		}
		// already imported?
		const existing = await db.collection('SessionSnapshots')
			.findOne({
				legacyId: s._id, owners: locals.email
			}) as SessionSnapshot;
		if (existing) {
			console.log(`legacy session ${s._id} already imported by ${locals.email}`);
			continue;
		}
		// guess its type
		const sessionType = guessSessionType( s );
		if (!sessionType) {
			console.log(`no sessionType guess for import ${s._id}`);
			continue;
		}
		console.log(`sessionType: ${sessionType}`);
		// new session
		let session = makeSession(sessionType, s);
		let snapshot = makeSessionSnapshot(sessionType, s);
		if (!session || !snapshot) {
			console.log(`Problem making session/snapshot for import ${s._id} (${sessionType})`);
			continue;
		}
		const sessionId = getNewId();
		const snapshotId = getNewId();
		session._id = sessionId;
		snapshot.sessionId = sessionId;
		snapshot._id = snapshotId;
		session.owners.push(locals.email);
		snapshot.owners.push(locals.email);
		let r1 = await db.collection('Sessions').insertOne(session);
		if (!r1.insertedCount) {
			console.log(`Error adding new imported session`);
			continue;
		}
		let r2 = await db.collection('SessionSnapshots').insertOne(snapshot);
		if (!r2.insertedCount) {
			console.log(`Error adding new imported snapshot`);
			continue;
		}
		message = message + `Imported ${sessionType} session ${s._id} as new session ${sessionId}\n`;
	}
	if (debug) console.log(message);
	return {
		body: { 
			message: message
		}
	}
}
  