import {getDb} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevisionSummary, CardDeckSummary} from "$lib/types"
import {error} from "@sveltejs/kit";
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {deckId} = params;
	const db = await getDb();
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		return error(404, `Deck ${deckId} not found`)
	}
	// project to summary
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions')
		.find({
			deckId: deckId
		}, {
			projection: {
				_id: true, deckId: true, revision: true, slug: true, deckName: true,
				deckDescription: true, deckCredits: true, created: true,
				lastModified: true, revisionName: true,
				revisionDescription: true, isUsable: true, isPublic: true,
				isLocked: true, isTemplate: true, cardCount: true
			}
		})
		.toArray()
	const current = revisions.find((r) => r.revision == deck.currentRevision);
	return {
		revisions: revisions,
		selectedRevision: current
	}
}