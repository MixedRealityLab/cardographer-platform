import {getDb, getNewId} from "$lib/db"
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {cleanRevision} from "./[deckId]/revisions";

const debug = true

export const post: RequestHandler = async function ({locals, request}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const revisionId = await request.text()
	console.log(revisionId)

	if (!revisionId) {
		if (debug) console.log(`no revisionId in copy`, revisionId)
		return {status: 400}
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
			return {status: 404}
		}
		if (!revision.isTemplate) {
			return {status: 400}
		}
		if (!revision.isPublic) {
			const deck = await db.collection<CardDeckSummary>('CardDeckSummary').findOne({
				_id: revision.deckId
			})
			if (!deck) {
				return {status: 404}
			}
			if (deck.owners.indexOf(locals.email) === -1) {
				return {status: 401}
			}
		}
	}
	await cleanRevision(db, revision, deckId, revId)

	const revResult = await db.collection<CardDeckRevision>('CardDeckRevisions').insertOne(revision)
	if (!revResult.insertedId) {
		console.log(`Error adding revision for new deck ${deckId}`)
		return {status: 500}
	}
	const deck: CardDeckSummary = {
		_id: deckId,
		name: revision.deckName,
		description: revision.deckDescription,
		isPublic: false,
		owners: [locals.email],
		currentRevision: revId,
		credits: revision.deckCredits,
	}
	// add deck
	const summaryResult = await db.collection<CardDeckSummary>('CardDeckSummaries').insertOne(deck)
	if (!summaryResult.insertedId) {
		console.log(`Error adding new deck ${deckId}`)
		return {status: 500}
	}
	console.log(`added deck ${deckId}`)

	return {
		body: {
			deckId: deckId,
			revId: revId
		}
	}
}
