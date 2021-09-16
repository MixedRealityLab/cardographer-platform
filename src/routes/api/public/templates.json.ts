import {getDb} from '$lib/db';
import type {CardDeckRevisionSummary} from '$lib/types';
import type {EndpointOutput} from '@sveltejs/kit';

const debug = true;

export async function get(): Promise<EndpointOutput> {
	const db = await getDb();
	// isPublic & isTemplate, project to summary
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		isPublic: true, isTemplate: true, isUsable: true
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

