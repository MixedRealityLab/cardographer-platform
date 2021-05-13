import {getDb} from '$lib/db.ts';
import type {CardDeckSummary} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		console.log(`locals`, locals);
		return { status: 403 }
	}
	console.log(`get decks`);
	const db = await getDb();
	const decks = await db.collection('CardDeckSummaries').find({
		owners: locals.email 
	}).toArray() as CardDeckSummary[];
	console.log(decks);
	return {
		body: {
			decks: decks
		}
	}
}
  
