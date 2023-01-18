import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, Session, SessionDeck} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		throw error(404);
	}
	// update session
	const cardIds = session.decks.map((deck) => deck.deckId + ":" + deck.revision)
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
	// Suggestion (check for correctness before using):
	// return new Response(cards as any);
	return json(cards)
}

export const PUT: RequestHandler = async function ({locals, request, params}) {
	verifyAuthentication(locals)
	const cardIds = await request.json() as string[];
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		throw error(404);
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
	if (!upd.modifiedCount) {
		if (debug) console.log(`session ${sessionId} not matched`, upd);
		throw error(404);
	}
	const newSession = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
	// Suggestion (check for correctness before using):
	// return new Response(newSession as any);
	return json(newSession)
}

