import {getDb} from '$lib/db.ts';
import type {Session} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const {sessid} = request.params;
	if (debug) console.log(`get session ${sessid}`);
	const db = await getDb();
	// permission check
	const session = await db.collection('Sessions').findOne({
		_id: sessid, owners: locals.email 
	}) as Sessions;
	if (!session) {
		if (debug) console.log(`session ${sessid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// project?
	return {
		body: session
	}
}
  
