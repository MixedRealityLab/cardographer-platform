import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, Session, SessionDeck} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

export const GET: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals, false)
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		throw error(404, `Session ${sessionId} not found`)
	}
	// update session
	const cardIds = session.decks.map((deck) => deck.deckId + ":" + deck.revision)
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()
	return json(cards)
}

// noinspection JSUnusedGlobalSymbols
export const PUT: RequestHandler = async function ({locals, request, params}) {
	await verifyAuthentication(locals, false)
	const cardIds = await request.json() as string[];
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		throw error(404, `Session ${sessionId} not found`)
	}
	// update session
	const now = new Date().toISOString();
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()
	const decks = cards.map((card) => {
		const deck: SessionDeck = {
			deckCredits: "", deckId: card.deckId, deckName: card.deckName, revision: card.revision
		}
		return deck
	})
	const upd = await db.collection<Session>('Sessions').updateOne({
		_id: sessionId
	}, {
		$set: {
			// project changes
			decks: decks,
			lastModified: now,
		}
	});
	if (!upd.matchedCount) {
		throw error(404, `Session ${sessionId} not found`)
	}
	const newSession = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	return json(newSession)
}