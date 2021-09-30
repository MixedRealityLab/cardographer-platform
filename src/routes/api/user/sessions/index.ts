import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Session} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = false;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	if (debug) console.log(`get sessions`);
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions').find({
		owners: locals.email
	}).toArray()
	if (debug) console.log(`sessions for ${locals.email}`, sessions);
	return {
		body: {
			values: sessions as any
		}
	}
}

