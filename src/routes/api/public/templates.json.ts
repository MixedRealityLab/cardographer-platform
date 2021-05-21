import {getDb} from '$lib/db.ts';
import type {CardDeckRevision,CardDeckRevisionSummary} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function get(request): RequestHandler {
	const db = await getDb();
	// isPublic & isTemplate, project to summary
	const revisions = await db.collection('CardDeckRevisions').find({
                isPublic: true, isTemplate: true, isUsable: true
        }, { _id: true, deckId: true, revision:true, slug: true, deckName: true,
		deckDescription: true, deckCredits: true, created: true,
		lastModified: true, revisionName: true, 
		revisionDescription: true, isUsable: true, isPublic: true,
		isLocked: true, isTemplate: true, cardCount: true
	}).toArray() as CardDeckRevisionSummary[];
	if (debug) console.log(`found ${revisions.length} public templates`);
	return {
		body: {
			values: revisions
		}
	}
}

