import {getDb} from "$lib/db";
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, Session, SessionDeck} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		return {status: 404};
	}
	// update session
	const cardIds = session.decks.map((deck) => deck.deckId + ":" + deck.revision)
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()
	return {
		body: cards as any
	}
}

export const PUT: RequestHandler = async function ({locals, request, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const cardIds = await request.json() as string[];
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		return {status: 404};
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
		if (debug) console.log(`session ${sessionId} not matched`, upd);
		return {status: 404};
	}
	const newSession = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	return {
		body: newSession as any
	}
}

