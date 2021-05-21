import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
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
	const {deckid,revid} = request.params;
	if (debug) console.log(`get revision ${revid} for ${deckid}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// project to summary
	const revision = await db.collection('CardDeckRevisions').findOne({
                deckId: deckid, revision: Number(revid)
        }) as CardDeckRevision;
	if (!revision) {
		if (debug) console.log(`revision ${revid} not found for deck ${deckid}`);
		return { status: 404 };
	}
	revision.isCurrent = revision.revision == deck.currentRevision;
	return {
		body: revision
	}
}
  
