import {getClient, guessSessionType} from '$lib/clients'
import {getDb} from '$lib/db'
import {verifyAuthentication} from "$lib/security"
import type {Session, SessionSnapshot} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'
import {json} from '@sveltejs/kit'

const debug = false

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
			.findOne({legacyId: s._id, owners: locals.email})
		if (existing) {
			message += `Session ${s.title || s.name || s.id} already imported\n`
			continue;
		}
		// guess its type
		const sessionType = guessSessionType(s);
		if (!sessionType) {
			message += `Unable to identify session type for ${s.title || s.name || s.id}\n`;
			continue;
		}
		if (debug) console.log(`SessionType: ${sessionType}`);
		const client = getClient(sessionType);
		// session already imported?
		const sessionQuery = client.getExistingSessionQuery(s)
		let session: Session;
		if (sessionQuery) {
			sessionQuery.owners = locals.email;
			session = await db.collection<Session>('Sessions').findOne(sessionQuery);
			if (session) {
				if (debug) console.log(`Session for import already exists`, sessionQuery);
			}
		}
		// new session
		if (!session) {
			session = client.makeSession(s);
			session.owners.push(locals.email);
			const r1 = await db.collection<Session>('Sessions').insertOne(session);
			if (!r1.insertedId) {
				message += `Error adding new session for ${s.title || s.name || s.id}\n`
				continue;
			}
		}
		const snapshot = client.makeSessionSnapshot(s, session);
		if (!snapshot) {
			message += `Error creating snapshot for ${s.title || s.name || s.id}\n`
			continue;
		}
		if (!snapshot.owners.includes(locals.email)) {
			snapshot.owners.push(locals.email)
		}
		const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
		if (!r2.insertedId) {
			message += `Error adding new session snapshot for ${s.title || s.name || s.id}\n`
			continue;
		}
		message += `Imported ${sessionType} session ${s.title || s.name || s._id}\n`;
	}
	if (debug) console.log(message);
	const sessions = await db.collection<Session>('Sessions')
		.find({owners: locals.email})
		.toArray()
	return json({
		message: message,
		sessions: sessions as any[]
	})
}
  
