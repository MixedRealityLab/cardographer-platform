import {getDb} from '$lib/db'
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevisionSummary, CardDeckSummary} from '$lib/types'
import type {EndpointOutput, Request} from '@sveltejs/kit'

const debug = true;

export async function get({locals}: Request): Promise<EndpointOutput> {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	if (debug) console.log(`get decks`);
	const db = await getDb();
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries').find({
		owners: locals.email
	}).toArray()
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		isUsable: true, $or: [{isPublic: true}, {deckId: {$in: decks.map((deck) => deck._id)}}]
	}, {
		projection: {
			_id: true, deckId: true, revision: true, slug: true, deckName: true,
			deckDescription: true, deckCredits: true, created: true,
			lastModified: true, revisionName: true,
			revisionDescription: true, isUsable: true, isPublic: true,
			isLocked: true, isTemplate: true, cardCount: true
		}
	}).toArray()
	if (debug) console.log(`decks for ${locals.email}`, decks);
	return {
		body: {
			decks: revisions as any[]
		}
	}
}