import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision,CardDeckRevisionSummary} 
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
	const {deckid} = request.params;
	if (debug) console.log(`get revisions for ${deckid}`);
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
	const revisions = await db.collection('CardDeckRevisions').find({
                deckId: deckid
        }, { _id: true, deckId: true, revision:true, slug: true, deckName: true,
		deckDescription: true, deckCredits: true, created: true,
		lastModified: true, revisionName: true, 
		revisionDescription: true, isUsable: true, isPublic: true,
		isLocked: true, isTemplate: true, cardCount: true
	}).toArray() as CardDeckRevisionSummary[];
	if (debug) console.log(`found ${revisions.length} revisions for ${deckid}`);
	return {
		body: {
			revisions: revisions
		}
	}
}
  
