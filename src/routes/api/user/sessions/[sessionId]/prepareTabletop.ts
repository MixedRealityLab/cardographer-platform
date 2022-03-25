import type {RequestHandler} from "@sveltejs/kit";
import {getDb} from "$lib/db";
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, Session} from "$lib/types";
import {mkdir} from 'fs/promises'

export const get: RequestHandler = async function ({locals, params}) {
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
		return {status: 404};
	}

	const dirName = '/app/data/sessions/' + sessionId + '/'
	await mkdir(dirName, {recursive: true})

	const cardIds = session.decks.map((deck) => deck.deckId + ":" + deck.revision)
	const cards = await db.collection<CardDeckRevision>('CardDeckRevisions').find(
		{_id: {$in: cardIds}}
	).toArray()

	// Create atlases?


	// Create DeckInfo.json



	return {}
}
