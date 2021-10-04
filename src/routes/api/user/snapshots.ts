import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {SessionSnapshot} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = false;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	if (debug) console.log(`get session snapshots`);
	const db = await getDb();
	const snapshots = await db.collection<SessionSnapshot>('SessionSnapshots').find({
		$or: [{owners: locals.email}, {isPublic: true}]
	}, {
		projection: {
			_id: true, sessionId: true, sessionName: true,
			sessionDescription: true, sessionCredits: true,
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

