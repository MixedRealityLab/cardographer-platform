import {getDb} from '$lib/db';
import type {CardDeckRevision} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const {deckId, revisionId} = request.params
	const db = await getDb()
	// isPublic & isTemplate, project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		_id: `${deckId}:${revisionId}`, isPublic: true, isTemplate: true
	})
	if (!revision) {
		if (debug) console.log(`public template ${deckId} ${revisionId} not found`);
		return {status: 404};
	}

	return {
		body: revision as any
	}
}

