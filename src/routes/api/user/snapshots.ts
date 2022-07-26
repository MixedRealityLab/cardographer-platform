import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {SessionSnapshot} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';

const debug = false;

export const GET: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	if (debug) console.log(`get session snapshots`);
	const db = await getDb();
	const snapshots = await db.collection<SessionSnapshot>('SessionSnapshots').find({
		$or: [{owners: locals.email}, {isPublic: true}]
	}, {
		projection: {
			_id: true, sessionId: true, sessionName: true,
			sessionDescription: true, sessionCredits: true, created: true,
			sessionType: true, originallyCreated: true,
			snapshotDescription: true
		}
	}).toArray()
	if (debug) console.log(`${snapshots} snapshots for ${locals.email}`);
	return {
		body: {
			values: snapshots as any[]
		}
	}
}

