import {getDb} from '$lib/db'
import {cleanRevisions} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevisionSummary, CardDeckSummary} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'
import {json} from '@sveltejs/kit';

const debug = true;

export const GET: RequestHandler = async function ({locals}) {
	verifyAuthentication(locals)
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
	await cleanRevisions(revisions, db)
	if (debug) console.log(`decks for ${locals.email}`, decks);
	return json({
		decks: revisions as any[]
	})
}
