import {getDb} from "$lib/db";
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevisionSummary, CardDeckSummary} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";

const debug = true

export const del: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {deckId} = params;
	if (debug) console.log(`get revisions for ${deckId}`)
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return {status: 404};
	}
	await db.collection<CardDeckRevisionSummary>('CardDeckSummaries').deleteOne({
		_id: deckId, owners: locals.email
	})
	await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').deleteMany({
		deckId: deckId
	})
	return {
		body: {}
	}
}