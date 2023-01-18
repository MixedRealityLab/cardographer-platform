import {getClient, guessSessionType} from "$lib/clients";
import {getDb, getNewId} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from "$lib/types";
import type {Actions, PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions')
		.find({owners: locals.email})
		.sort({"name": 1, "owners[0]": 1, "created": 1, "_id": 1})
		.toArray()
	return {
		sessions: sessions
	}
}

export const actions: Actions = {
	default: async ({locals, request}) => {
		verifyAuthentication(locals)
		const data = await request.formData();
		const files = data.getAll('files') as File[]
		const db = await getDb();
		let message = ""
		// permission check
		console.log(files)
		for (const file of files) {
			const s = JSON.parse(await file.text())
			//if(debug) console.log(`import`, s);
			if (!s._id) {
				message = message + `${file.name}: Contains no _id\n`
				continue;
			}
			// already imported?
			const existing = await db.collection<SessionSnapshot>('SessionSnapshots')
				.findOne({
					legacyId: s._id, owners: locals.email
				})
			if (existing) {
				message = message + `${file.name}: Already imported\n`
				continue;
			}
			// guess its type
			const sessionType = guessSessionType(s);
			if (!sessionType) {
				message = message + `${file.name}: Cannot identify session type\n`
				continue;
			}
			const client = getClient(sessionType);
			// session already imported?
			const squery = client.getExistingSessionQuery(s)
			let session: Session;
			let addSession = true;
			if (squery) {
				squery.owners = locals.email;
				session = await db.collection<Session>('Sessions').findOne(squery);
				if (session) {
					addSession = false;
					//if (debug) console.log(`session for import already exists`, squery);
				}
			}
			// new session
			if (!session) {
				session = client.makeSession(s);
			}
			const snapshot = client.makeSessionSnapshot(s);
			if (!session || !snapshot) {
				message = message + `${file.name}: Problem importing\n`
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
					message = message + `${file.name}: Problem importing\n`
					continue;
				}
			}
			const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
			if (!r2.insertedId) {
				message = message + `${file.name}: Problem importing\n`
				continue;
			}
			message = message + `${file.name}: Imported ${addSession ? 'new' : 'existing'} ${sessionType} session ${s.title || s.name || s._id}\n`;
		}

		console.log(message)

		return {message: message}
	}
}