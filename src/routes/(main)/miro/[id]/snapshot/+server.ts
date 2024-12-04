import {getClient, guessSessionType} from "$lib/clients";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit"
import { getUsageSnapshots, getQuotaDetails } from "$lib/quotas";

// noinspection JSUnusedGlobalSymbols
export const POST: RequestHandler = async function ({locals, request, params}) {
	await verifyAuthentication(locals)
	const usageSnapshots = await getUsageSnapshots(locals.email)
	const quota = await getQuotaDetails(locals.email)
	if (usageSnapshots >= quota.quota.snapshots) {
		console.log(`Snapshot quota exceeded ${usageSnapshots}/${quota.quota.snapshots} for ${locals.email}`)
		throw error(422, "Snapshot quote exceeded")
	}
	const snapshotData = await request.json()

	let sessionType = guessSessionType(snapshotData);
	if (!sessionType) {
		throw error(400, "Cannot Determine Session Type")
	}

	const db = await getDb();
	const url = "https://miro.com/app/board/" + params.id
	const session = await db.collection<Session>('Sessions').findOne({
		owners: locals.email, url: url
	})
	if (!session) {
		throw error(404, "Session Not Found")
	}

	const exists = await db.collection<SessionSnapshot>('SessionSnapshots').countDocuments({
		sessionId: session._id,
		"data.id": snapshotData.id,
		"data.updatedAt": snapshotData.updatedAt
	})
	if (exists > 0) {
		throw error(409, "Session Already Uploaded")
	}

	const client = getClient(sessionType);
	if (!client) {
		throw error(500, "Could Not Detect Client")
	}
	const snapshot = client.makeSessionSnapshot(snapshotData, session);
	snapshot.quotaUser = locals.email
	const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
	if (!r2.insertedId) {
		throw error(500, "Upload Failed")
	}

	session.sessionType = sessionType
	session.url = url
	session.lastModified = new Date().toISOString()
	const upd = await db.collection<Session>('Sessions').updateOne({
		_id: session._id
	}, {
		$set: {
			// project changes
			lastModified: session.lastModified,
			// backward compatibility - may not have been set on old linked sessions
			sessionType: 'miro',
			miroId: params.id,
		}
	});
	if (!upd) {
		throw error(500, "Upload Failed")
	}

	return json({success: true})
}