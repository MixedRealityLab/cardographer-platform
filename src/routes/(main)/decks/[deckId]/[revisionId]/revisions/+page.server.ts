import {base} from "$app/paths";
import {getDb} from "$lib/db"
import {cleanRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary, User} from "$lib/types"
import {error, redirect} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from "./$types";
import type {LayoutServerLoad} from "./$types"
import { getUser } from "$lib/userutils"
import { getUsageRevisions, getQuotaDetails } from "$lib/quotas";

export const load: PageServerLoad = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {deckId} = params;
	const db = await getDb();
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		throw error(404, `Deck ${deckId} not found`)
	}
	// project to summary
	let revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions')
		.find({
			deckId: deckId
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
	revisions.sort((a,b) => a.revision - b.revision)
	const current = revisions.find((r) => r.revision == deck.currentRevision);
	// note +page@ skips most layout data, so add this explicitly here...
	let localUser : User|null = null
	if (locals.authenticated && locals.email) {
		const db = await getDb()
		localUser = await getUser(db, locals.email, locals.email)
		//console.log(`local user is ${locals.email}, ${localUser.isDeckBuilder ? 'deck builder' : ''}, ${localUser.isPublisher ? 'publisher' : ''}, ${localUser.isAdmin ? 'admin' : ''}`)
	}
	const usageRevisions = await getUsageRevisions(locals.email)
	const quota = await getQuotaDetails(locals.email)
	
	return {
		revisions: revisions,
		selectedRevision: current,
		localUser,
		usageRevisions,
		quotaRevisions : quota.quota.revisions,
	}
}

export const actions: Actions = {
	default: async ({locals, params}) => {
		await verifyAuthentication(locals)
		const usageRevisions = await getUsageRevisions(locals.email)
		const quota = await getQuotaDetails(locals.email)
		if (usageRevisions >= quota.quota.revisions) {
			console.log(`Exceeded revision quota ${usageRevisions}/${quota.quota.revisions} for ${locals.email}`)
			throw error(422,"Revisions quota exceeded")
		}
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
		revision.quotaUser = locals.email
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