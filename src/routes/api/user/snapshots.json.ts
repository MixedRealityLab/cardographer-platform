import {getDb} from '$lib/db.ts';
import type {SessionSnapshot} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = false;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	if (debug) console.log(`get session snapshots`);
	const db = await getDb();
	const snapshots = await db.collection('SessionSnapshots').find({
		$or: [ { owners: locals.email },
			{ isPublic: true } ]
	}, {
		_id: true, sessionId: true, sessionName: true, 
		sessionDescription: true, sessionCredits: true,
		sessionType: true, originallyCreated: true,
		snapshotDescription: true
	}).toArray() as SessionSnapshot[];
	if (debug) console.log(`${snapshots} snapshots for ${locals.email}`);
	return {
		body: {
			values: snapshots
		}
	}
}

