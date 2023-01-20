import {getClient, guessSessionType} from "$lib/clients";
import {getDb, getNewId} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit"

export const POST: RequestHandler = async function ({locals, request, params}) {
	verifyAuthentication(locals)
	const snapshotData = await request.json()

	let sessionType = guessSessionType(snapshotData);
	if (!sessionType) {
		throw error(400, "Cannot Determine Session Type")
	}

	const db = await getDb();
	const url = "https://miro.com/app/board/" + params.id
	const session = await db.collection<Session>('Sessions').findOne({
		$or: [{owners: locals.email}, {isPublic: true}], url: url
	})
	if (!session) {
		throw error(404, "Session Not Found")
	}

	const exists = await db.collection<SessionSnapshot>('SessionSnapshots').countDocuments({
		sessionId: session._id,
		data: snapshotData
	})
	if (exists > 0) {
		throw error(409)
	}

	const client = getClient(sessionType);
	const snapshot = client.makeSessionSnapshot(snapshotData);
	snapshot.sessionId = session._id;
	snapshot._id = getNewId();
	snapshot.owners = session.owners;

	// TODO Some Versioning?

	const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
	if (!r2.insertedId) {
		throw error(500)
	}

	// session already imported?
	session.sessionType = sessionType
	session.url = url
	session.lastModified = new Date().toISOString()
	const upd = await db.collection<Session>('Sessions').updateOne({
		_id: session._id
	}, {
		$set: {
			// project changes
			lastModified: session.lastModified,
			sessionType: session.sessionType,
			url: session.url,
		}
	});
	if (!upd) {
		throw error(500)
	}

	return json({success: true})
}