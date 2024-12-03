import {getDb} from "$lib/db"
import {cleanRevisions} from "$lib/decks"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary} from "$lib/types"
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals, true, true)
	const db = await getDb();
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries')
		.find({owners: locals.email})
		.toArray()
	// current revision of each deck I own
	const myrevisions = await Promise.all(decks.map((deck) =>
		db.collection<CardDeckRevision>('CardDeckRevisions')
			.findOne({deckId: deck._id, revision: deck.currentRevision})
	));
	myrevisions.forEach((deck) => deck.isOwnedByUser = true);
	// public revisions (not including mine)
	const publicrevisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions')
		.find({
			isPublic: true, $nor: [{deckId: {$in: decks.map((deck) => deck._id)}}]
		}, {
			projection: {
				_id: true, deckId: true, revision: true, slug: true, deckName: true,
				deckDescription: true, deckCredits: true, created: true,
				lastModified: true, revisionName: true,
				revisionDescription: true, isUsable: true, isPublic: true,
				isLocked: true, isTemplate: true, cardCount: true,
				diskSizeK: true,
			}
		})
		.toArray()
	const revisions = myrevisions.concat(publicrevisions)
	await cleanRevisions(revisions, db);
	revisions.sort((revisiona, revisionb) => (revisiona.deckName + revisiona._id).toLowerCase().localeCompare((revisionb.deckName + revisionb._id).toLowerCase()))
	return {
		decks: revisions
	}
}