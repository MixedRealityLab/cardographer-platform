import {base} from "$app/paths"
import {getDb, getNewId} from "$lib/db"
import {cleanRevision, cleanRevisions} from "$lib/decks"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {error, redirect} from "@sveltejs/kit"
import type {PageServerLoad} from "./$types"
import { verifyLocalUserIsDeckBuilder } from "$lib/userutils"
import { CHECK_REVISION_DISK_SIZE, getUsageDiskSizeK, getQuotaDetails, getUsageDecks, getUsageRevisions, checkRevisionDiskSizes } from "$lib/quotas"

const debug = false

export const load: PageServerLoad = async function ({locals}) {
	await verifyAuthentication(locals)
	const db = await getDb();
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions')
		.find({
		$or: [{isPublic: true}, {owners: locals.email}], isTemplate: true, isUsable: true
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
		.sort({"deckName": 1, "revision": 1, "revisionName": 1})
		.toArray()
	await checkRevisionDiskSizes(revisions)
	await cleanRevisions(revisions, db)
	const usageDecks = await getUsageDecks(locals.email)
	const usageRevisions = await getUsageRevisions(locals.email)
	const usageDiskSizeK = await getUsageDiskSizeK(locals.email)
	const quota = await getQuotaDetails(locals.email)
	if (debug) console.log(`User ${locals.email} deck usage ${usageDecks}/${quota.quota.decks} decks & ${usageRevisions}/${quota.quota.revisions} revisions`)
	return {
		revisions: revisions,
		usageDecks,
		usageRevisions,
		usageDiskSizeK,
		quotaDecks: quota.quota.decks,
		quotaRevisions: quota.quota.revisions,
		quotaDiskSizeK: quota.quota.diskSizeK,
	}
}

export const actions: Actions = {
	default: async ({ locals, request}) => {
		await verifyAuthentication(locals)
		await verifyLocalUserIsDeckBuilder(locals)
		const usageDecks = await getUsageDecks(locals.email)
		const usageRevisions = await getUsageRevisions(locals.email)
		const usageDiskSizeK = await getUsageDiskSizeK(locals.email)
		const quota = await getQuotaDetails(locals.email)
		if (usageDecks >= quota.quota.decks || usageRevisions >= quota.quota.revisions || usageDiskSizeK >= quota.quota.diskSizeK) {
			console.log(`Exceeded quota ${usageDecks}/${quota.quota.decks} decks or ${usageRevisions}/${quota.quota.revisions} revisions ${usageDiskSizeK}/${quota.quota.diskSizeK} disk for for ${locals.email}`)
			throw error(422,"Deck/revision/disk quota exceeded")
		}
		const data = await request.formData()
		const revisionId = data.get('id') as string

		console.log(revisionId)

		if (!revisionId) {
			throw error(400, "No RevisionID")
		}
		//if (debug) console.log(`add deck`, revision)
		const db = await getDb()
		const deckId = getNewId()
		const revId = 1
		let revision: CardDeckRevision
		const now = new Date().toISOString()
		if (revisionId === 'blank') {
			revision = {
				_id: `${deckId}:${revId}`,
				cardCount: 0,
				created: now,
				deckId: deckId,
				deckName: "New Deck",
				deckDescription: "A Blank Deck",
				slug: "",
				isLocked: false,
				isPublic: false,
				isTemplate: false,
				isUsable: false,
				lastModified: now,
				revision: revId,
				cards: [],
				defaults: undefined,
				propertyDefs: []
			}
		} else {
			revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
				_id: revisionId
			})
			if (!revision) {
				throw error(404)
			}
			if (!revision.isTemplate) {
				throw error(400)
			}
			if (!revision.isPublic) {
				const deck = await db.collection<CardDeckSummary>('CardDeckSummary').findOne({
					_id: revision.deckId
				})
				if (!deck) {
					throw error(404)
				}
				if (deck.owners.indexOf(locals.email) === -1) {
					throw error(401)
				}
			}
		}
		await cleanRevision(db, revision, deckId, revId)
		if (CHECK_REVISION_DISK_SIZE && typeof(revision.diskSizeK) == 'number') {
			if (usageDiskSizeK + revision.diskSizeK > quota.quota.diskSizeK) {
				console.log(`Will exceed quota ${usageDiskSizeK}+${revision.diskSizeK}/${quota.quota.diskSizeK} disk for for ${locals.email}`)
				throw error(422,"Disk quota would be exceeded")
			}
		}
		revision.quotaUser = locals.email
		const revResult = await db.collection<CardDeckRevision>('CardDeckRevisions').insertOne(revision)
		if (!revResult.insertedId) {
			console.log(`Error adding revision for new deck ${deckId}`)
			throw error(500)
		}
		const deck: CardDeckSummary = {
			_id: deckId,
			isPublic: false,
			owners: [locals.email],
			currentRevision: revId,
			quotaUser: locals.email,
		}
		// add deck
		const summaryResult = await db.collection<CardDeckSummary>('CardDeckSummaries').insertOne(deck)
		if (!summaryResult.insertedId) {
			console.log(`Error adding new deck ${deckId}`)
			throw error(500)
		}
		console.log(`added deck ${deckId}`)

		throw redirect(302, base + '/decks/' + deckId + '/' + revId)
	}
}