import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {CardDeckRevisionSummary, CardDeckSummary} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	if (debug) console.log(`get decks`);
	const db = await getDb();
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries').find({
		owners: locals.email
	}).toArray()
	const revisions: CardDeckRevisionSummary[] = []
	for (const deck of decks) {
		const deckRevisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
			deckId: deck._id
		}, {
			projection: {
				_id: true, deckId: true, revision: true, slug: true, deckName: true,
				deckDescription: true, deckCredits: true, created: true,
				lastModified: true, revisionName: true,
				revisionDescription: true, isUsable: true, isPublic: true,
				isLocked: true, isTemplate: true, cardCount: true
			}
		}).toArray()
		revisions.push(...deckRevisions)
	}
	const publicRevisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		isPublic: true, isUsable: true
	}, {
		projection: {
			_id: true, deckId: true, revision: true, slug: true, deckName: true,
			deckDescription: true, deckCredits: true, created: true,
			lastModified: true, revisionName: true,
			revisionDescription: true, isUsable: true, isPublic: true,
			isLocked: true, isTemplate: true, cardCount: true
		}
	}).toArray()
	publicRevisions.forEach((publicRevision) => {
		if (!revisions.some((revision) => publicRevision._id == revision._id)) {
			revisions.push(publicRevision)
		}
	})
	if (debug) console.log(`decks for ${locals.email}`, decks);
	return {
		body: {
			decks: revisions as any[]
		}
	}
}