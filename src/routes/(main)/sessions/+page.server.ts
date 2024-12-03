import {getClient, guessSessionType} from "$lib/clients";
import {getDb, getNewId} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from "$lib/types";
import { getUsageSnapshots, getQuotaDetails, getUsageSessions } from "$lib/quotas";
import type {Actions, PageServerLoad} from "./$types"
import {error} from "@sveltejs/kit";

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions')
		.find({owners: locals.email})
		.sort({"name": 1, "owners[0]": 1, "created": 1, "_id": 1})
		.toArray()
	const usageSessions = await getUsageSessions(locals.email)
	const quota = await getQuotaDetails(locals.email)
	return {
		sessions: sessions,
		usageSessions,
		quotaSessions: quota.quota.sessions,
	}
}

export const actions: Actions = {
	default: async ({locals, request}) => {
		// this is a session snapshot upload...
		verifyAuthentication(locals)
		const usageSessions = await getUsageSessions(locals.email)
		const quota = await getQuotaDetails(locals.email)
		if (usageSessions >= quota.quota.sessions) {
			console.log(`Exceeded session quota ${usageSessions}/${quota.quota.sessions} for ${locals.email}`)
			throw error(422,"Session quota exceeded")
		}
		const usageSnapshots = await getUsageSnapshots(locals.email)
		if (usageSnapshots >= quota.quota.snapshots) {
			console.log(`Exceeded snapshot quota ${usageSessions}/${quota.quota.sessions} for ${locals.email}`)
			throw error(422,"Snapshot quota exceeded")
		}
		const data = await request.formData();
		const files = data.getAll('files') as File[]
		const db = await getDb();
		let message = ""
		// permission check
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
			const sessionQuery = client.getExistingSessionQuery(s)
			let session: Session;
			let addSession = true;
			if (sessionQuery) {
				sessionQuery.owners = locals.email;
				session = await db.collection<Session>('Sessions').findOne(sessionQuery);
				if (session) {
					addSession = false;
					//if (debug) console.log(`session for import already exists`, squery);
				}
			}
			// new session
			if (!session) {
				session = client.makeSession(s);
			}
			const snapshot = client.makeSessionSnapshot(s, session);
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
				session.quotaUser = locals.email
				const r1 = await db.collection<Session>('Sessions').insertOne(session);
				if (!r1.insertedId) {
					message = message + `${file.name}: Problem importing\n`
					continue;
				}
			}
			snapshot.quotaUser = locals.email
			const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
			if (!r2.insertedId) {
				message = message + `${file.name}: Problem importing\n`
				continue;
			}
			message = message + `${file.name}: Imported ${addSession ? 'new' : 'existing'} ${sessionType} session ${s.title || s.name || s._id}\n`;
		}

		return {message: message}
	}
}