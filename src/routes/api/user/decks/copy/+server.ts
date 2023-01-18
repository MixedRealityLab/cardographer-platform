import {getDb, getNewId} from "$lib/db"
import {cleanRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from '@sveltejs/kit';

const debug = true

export const POST: RequestHandler = async function ({locals, request}) {
	verifyAuthentication(locals)
	const revisionId = await request.text()
	console.log(revisionId)

	if (!revisionId) {
		if (debug) console.log(`no revisionId in copy`, revisionId)
		throw error(400)
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

	const revResult = await db.collection<CardDeckRevision>('CardDeckRevisions').insertOne(revision)
	if (!revResult.insertedId) {
		console.log(`Error adding revision for new deck ${deckId}`)
		throw error(500)
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
		throw error(500)
	}
	console.log(`added deck ${deckId}`)

	return json({
		deckId: deckId,
		revId: revId
	})
}
