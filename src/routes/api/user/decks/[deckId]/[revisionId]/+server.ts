import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {error, json} from '@sveltejs/kit';

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals, false)
	const {deckId, revisionId} = params;
	if (debug) console.log(`get revision ${revisionId} for ${deckId}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		throw error(404, `Deck ${deckId} not found`)
	}
	// project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		throw error(404, `Deck ${deckId}:${revisionId} not found`)
	}
	revision.isCurrent = revision.revision == deck.currentRevision;
	return json(revision)
}