import {getDb} from '$lib/db.ts';
import type {Analysis} 
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
	const {analid} = request.params;
	if (debug) console.log(`get analysis ${analid}`);
	const db = await getDb();
	// permission check
	const analysis = await db.collection('Analyses').findOne({
		_id: analid, owners: locals.email 
	}) as Analysis;
	if (!analysis) {
		if (debug) console.log(`analysis ${analid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// project?
	return {
		body: analysis
	}
}
  
