import {getDb} from '$lib/db';
import type {ServerLocals} from "$lib/systemtypes";
import type {CardDeckRevisionSummary} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	const db = await getDb();
	// isPublic & isTemplate, project to summary
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		$or: [{isPublic: true}, {owners: locals.email}], isTemplate: true, isUsable: true
	}, {
		projection: {
			_id: true, deckId: true, revision: true, slug: true, deckName: true,
			deckDescription: true, deckCredits: true, created: true,
			lastModified: true, revisionName: true,
			revisionDescription: true, isUsable: true, isPublic: true,
			isLocked: true, isTemplate: true, cardCount: true
		}
	}).toArray()
	if (debug) console.log(`found ${revisions.length} public templates`);
	return {
		body: {
			values: revisions as any
		}
	}
}

