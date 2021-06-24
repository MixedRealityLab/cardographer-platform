import {getDb} from '$lib/db.ts';
import type {Analysis} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = false;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	if (debug) console.log(`get analyses`);
	const db = await getDb();
	const analyses = await db.collection('Analyses').find({
		owners: locals.email 
	}).toArray() as Analysis[];
	// Project?
	if (debug) console.log(`${analyses.length} analyses for ${locals.email}`);
	return {
		body: {
			values: analyses
		}
	}
}

