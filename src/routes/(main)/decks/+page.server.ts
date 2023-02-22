import {getDb} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckSummary} from "$lib/types"
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb();
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries')
		.find({owners: locals.email})
		.toArray()

	const revisions = await Promise.all(decks.map((deck) =>
		db.collection<CardDeckRevision>('CardDeckRevisions')
			.findOne({deckId: deck._id, revision: deck.currentRevision})
	))
	revisions.sort((revisiona, revisionb) => (revisiona.deckName + revisiona._id).toLowerCase().localeCompare((revisionb.deckName + revisionb._id).toLowerCase()))
	return {
		decks: revisions
	}
}