import { json } from '@sveltejs/kit';
import {getDb} from '$lib/db'
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevisionSummary, CardDeckSummary, User} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'
import type {Db} from "mongodb";

const debug = true;

export const get: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
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
	await cleanRevisions(revisions, db)
	if (debug) console.log(`decks for ${locals.email}`, decks);
	return json({
		decks: revisions as any[]
	})
}

export async function cleanRevisions(revisions: CardDeckRevisionSummary[], db: Db) {
	const users = await db.collection<User>('Users').find({}).toArray()
	for (const revision of revisions) {
		if (!(revision.deckCredits)) {
			const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({_id: revision.deckId})
			if (deck) {
				if (deck.owners && deck.owners.length > 0) {
					revision.deckCredits = deck.owners.map(owner => userName(owner, users)).join(', ')
				}
			}
		}
	}
}

function userName(email: string, users: User[]): string {
	const user = users.find(user => user.email === email)
	if (user.name) {
		return user.name
	}

	return email.slice(0, email.indexOf('@'))
}