import {getDb} from '$lib/db.ts';
import type {CardDeckSummary} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = false;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	if (debug) console.log(`get decks`);
	const db = await getDb();
	const decks = await db.collection('CardDeckSummaries').find({
		owners: locals.email 
	}).toArray() as CardDeckSummary[];
	if (debug) console.log(`decks for ${locals.email}`, decks);
	return {
		body: {
			decks: decks
		}
	}
}
  
