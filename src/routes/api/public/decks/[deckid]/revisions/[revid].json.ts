import {getDb} from '$lib/db.ts';
import type {CardDeckRevision} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function get(request): RequestHandler {
        const {deckid,revid} = request.params;
	const db = await getDb();
	// isPublic & isTemplate, project to summary
	const revision = await db.collection('CardDeckRevisions').findOne({
		_id: `${deckid}:${revid}`, isPublic: true, isTemplate: true
	}) as CardDeckRevision;
	if (!revision) {
		if (debug) console.log(`public template ${deckid} ${revid} not found`);
		return { status: 404 };
	}

	return {
		body: revision
	}
}

