import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {json} from "@sveltejs/kit";
import type {Db} from "mongodb";

export const GET: RequestHandler = async function ({locals}) {
	verifyAuthentication(locals, false)
	const db = await getDb();
	const snapshotItems = await db.collection<SessionSnapshot>('SessionSnapshots').find({
		$or: [{owners: locals.email}, {isPublic: true}]
	}, {
		projection: {
			_id: true, sessionId: true, created: true,
			sessionType: true, snapshotDescription: true
		}
	}).toArray()
	let snapshots = []
	for (const snapshot of snapshotItems) {
		const item = await mapSnapshot(snapshot, db)
		if (item) {
			snapshots.push(item)
		}
	}
	return json({values: snapshots as any[]})
}

async function mapSnapshot(snapshot, db: Db) {
	const session = await db.collection<Session>('Sessions').findOne({_id: snapshot.sessionId})
	if (session) {
		snapshot.sessionName = session.name
		snapshot.sessionCredits = session.credits
		snapshot.sessionDescription = session.description
		return snapshot
	}
	return null
}
