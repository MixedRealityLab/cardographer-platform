import {getDb} from '$lib/db.ts';
import type {Session} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = false;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	if (debug) console.log(`get sessions`);
	const db = await getDb();
	const sessions = await db.collection('Sessions').find({
		owners: locals.email 
	}).toArray() as Session[];
	if (debug) console.log(`sessions for ${locals.email}`, sessions);
	return {
		body: {
			values: sessions
		}
	}
}

