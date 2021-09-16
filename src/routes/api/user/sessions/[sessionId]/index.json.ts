import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Session} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const {sessid} = request.params;
	if (debug) console.log(`get session ${sessid}`);
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessid, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`session ${sessid} not found for ${locals.email}`);
		return {status: 404};
	}
	// project?
	return {
		body: session as any
	}
}
  
