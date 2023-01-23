import {getClient, guessSessionType} from '$lib/clients';
import {getDb, getNewId} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {json} from '@sveltejs/kit';
import type {Filter} from "mongodb";

const debug = true;

export const POST: RequestHandler = async function ({locals, request}) {
	verifyAuthentication(locals, false)
	let ss: any[];
	const body = await request.json()
	if (!Array.isArray(body)) {
		ss = [body];
	} else {
		ss = body
	}
	const db = await getDb();
	let message = '';
	for (const si in ss) {
		const s = ss[si];
		if (!s._id) {
			continue;
		}
		// already imported?
		const existing = await db.collection<SessionSnapshot>('SessionSnapshots')
			.findOne({
				legacyId: s._id, owners: locals.email
			})
		if (existing) {
			message = message + `Session ${s.title || s.name || s.id} already imported\n`
			continue;
		}
		// guess its type
		const sessionType = guessSessionType(s);
		if (!sessionType) {
			console.log(`no sessionType guess for import ${s._id}`);
			continue;
		}
		console.log(`SessionType: ${sessionType}`);
		const client = getClient(sessionType);
		// session already imported?
		const squery = client.getExistingSessionQuery(s) as Filter<Session>
		let session: Session;
		let addSession = true;
		if (squery) {
			squery.owners = locals.email;
			session = await db.collection<Session>('Sessions').findOne(squery);
			if (session) {
				addSession = false;
				if (debug) console.log(`session for import already exists`, squery);
			}
		}
		// new session
		if (!session) {
			session = client.makeSession(s);
		}
		const snapshot = client.makeSessionSnapshot(s);
		if (!session || !snapshot) {
			console.log(`Problem making session/snapshot for import ${s._id} (${sessionType})`);
			continue;
		}
		const sessionId = addSession ? getNewId() : session._id;
		const snapshotId = getNewId();
		snapshot.sessionId = sessionId;
		snapshot._id = snapshotId;
		if (addSession) {
			session._id = sessionId;
			session.owners.push(locals.email);
		}
		snapshot.owners.push(locals.email);
		if (addSession) {
			const r1 = await db.collection<Session>('Sessions').insertOne(session);
			if (!r1.insertedId) {
				console.log(`Error adding new imported session`);
				continue;
			}
		}
		const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
		if (!r2.insertedId) {
			console.log(`Error adding new imported snapshot`);
			continue;
		}
		message = message + `Imported ${addSession ? 'new' : 'existing'} ${sessionType} session ${s.title || s.name || s._id}\n`;
	}
	if (debug) console.log(message);
	const sessions = await db.collection<Session>('Sessions').find({
		owners: locals.email
	}).toArray()
	return json({
		message: message,
		sessions: sessions as any[]
	})
}
  
