import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {LayoutServerLoad} from "./$types"

export const load: LayoutServerLoad = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {deckId, revisionId} = params;
	const db = await getDb();
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		return error(404, `Deck ${deckId} not found`);
	}
	// project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		return error(404, `Deck ${deckId}/${revisionId} not found`);
	}
	revision.isCurrent = revision.revision == deck.currentRevision;
	return revision
}
