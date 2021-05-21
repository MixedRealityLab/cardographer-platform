import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import {getFileInfo} from '$lib/builders/index.ts';

const debug = true;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const {deckid,revid,file} = request.params;
	if (debug) console.log(`get file ${deckid}/${revid}/${file}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	try {
		const files = await getFileInfo(deckid, revid, file);
		return {
			body: files
		}
	} catch (err) {
		console.log(`error getting file ${deckid}/${revid}/${file}: ${err.message}`);
		return { status: 500 }
	}
}
  
