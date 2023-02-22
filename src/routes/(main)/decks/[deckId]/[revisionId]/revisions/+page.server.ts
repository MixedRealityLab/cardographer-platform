import {base} from "$app/paths";
import {getDb} from "$lib/db"
import {cleanRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary} from "$lib/types"
import {error, redirect} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from "./$types";

export const load: PageServerLoad = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {deckId} = params;
	const db = await getDb();
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		throw error(404, `Deck ${deckId} not found`)
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

export const actions: Actions = {
	default: async ({locals, params}) => {
		verifyAuthentication(locals)
		const db = await getDb();
		const {deckId} = params;
		const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
			_id: deckId, owners: locals.email
		})
		if (!deck) {
			throw error(404, `Deck ${deckId} not found`)
		}
		// new revision...
		const revId = deck.currentRevision + 1;
		const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
			deckId: deckId, revision: deck.currentRevision
		})
		if (!revision) {
			throw error(404, `Deck ${deckId} revision ${deck.currentRevision} not found`)
		}
		await cleanRevision(db, revision, deckId, revId)
		// add
		const insertResult = await db.collection<CardDeckRevision>('CardDeckRevisions').insertOne(revision);
		if (!insertResult.acknowledged) {
			throw error(500, `Error creating new revision`)
		}
		// update deck
		const updateResult = await db.collection<CardDeckSummary>('CardDeckSummaries').updateOne({
			_id: deckId
		}, {
			$set: {
				currentRevision: revId
			}
		});
		if (!updateResult.modifiedCount) {
			throw error(500, `Error creating new revision`)
		}
		throw redirect(302, `${base}/decks/${deckId}/${revId}`)
	}
}