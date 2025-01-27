import {getDb} from "$lib/db"
import {cleanRevisions} from "$lib/decks"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckSummary} from "$lib/types"
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	await verifyAuthentication(locals, true, true)
	const db = await getDb();
	const decks: CardDeckSummary[] = await db.collection<CardDeckSummary>('CardDeckSummaries')
		.find({owners: locals.email})
		.toArray()
	// current revision of each deck I own
	let myRevisions: CardDeckRevision[] = await Promise.all(decks.map((deck) =>
		db.collection<CardDeckRevision>('CardDeckRevisions')
			.findOne({deckId: deck._id, revision: deck.currentRevision})
	));
	myRevisions = myRevisions.filter((deck) => !!deck)
	myRevisions.forEach((deck) => deck.isOwnedByUser = true);
	// public revisions (not including mine)
	const publicRevisions: CardDeckRevision[] = await db.collection<CardDeckRevision>('CardDeckRevisions')
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
	const revisions = myRevisions.concat(publicRevisions)
	await cleanRevisions(revisions, db);
	revisions.sort((revisionA, revisionB) => (revisionA.deckName + revisionA._id).toLowerCase().localeCompare((revisionB.deckName + revisionB._id).toLowerCase()))
	return {
		decks: revisions
	}
}