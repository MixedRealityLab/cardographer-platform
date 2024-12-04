import {getDb} from "$lib/db";
import {cleanRevisions} from "$lib/decks";
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary, Session, SessionDeck} from "$lib/types"
import {error} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from './$types'


interface DeckInfo {
	deckId: string
	revisions: CardDeckRevisionSummary[]
	index: number
	selected: boolean
}

export const load: PageServerLoad = async function ({locals, parent}) {
	await verifyAuthentication(locals)
	const session = await parent()
	const db = await getDb()
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries').find({
		owners: locals.email
	}).toArray()
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions')
		.find({
			isUsable: true, $or: [{isPublic: true}, {deckId: {$in: decks.map((deck) => deck._id)}}]
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
		.sort({})
		.toArray()
	await cleanRevisions(revisions, db)

	let deckInfo: DeckInfo[] = []
	revisions.forEach((revision) => {
		const deck = deckInfo.find((deckItem) => deckItem.deckId == revision.deckId)
		if (!deck) {
			deckInfo.push({
				deckId: revision.deckId,
				revisions: [revision],
				index: -1,
				selected: false
			})
		} else {
			deck.revisions.push(revision)
		}
	})
	deckInfo.forEach((deckInfo) => {
		if (session.decks) {
			const sessionDeck = session.decks.find((sessionDeck) => sessionDeck.deckId == deckInfo.deckId)
			if (sessionDeck) {
				deckInfo.index = deckInfo.revisions.findIndex((revision) => revision.revision === sessionDeck.revision)
				deckInfo.selected = true
			}
		}
		if (deckInfo.index === -1) {
			deckInfo.index = deckInfo.revisions.length - 1
		}
	})

	return {
		session: session,
		decks: deckInfo
	}
}

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		await verifyAuthentication(locals)
		const {sessionId} = params
		const db = await getDb()
		const session = await db.collection<Session>('Sessions').findOne({
			_id: sessionId, owners: locals.email
		})
		if (!session) {
			throw error(404, `Session ${sessionId} not found`);
		}

		const data = await request.formData()
		let cardIds = data.getAll('decks') as string[]

		// update session
		const now = new Date().toISOString()
		const cards = await db.collection<CardDeckRevision>('CardDeckRevisions')
			.find({_id: {$in: cardIds}})
			.toArray()
		const decks = cards.map((card) => {
			const deck: SessionDeck = {
				deckId: card.deckId, deckName: card.deckName, revision: card.revision
			}
			return deck
		})
		const updateResult = await db.collection<Session>('Sessions').updateOne({
			_id: sessionId
		}, {
			$set: {
				// project changes
				decks: decks,
				lastModified: now,
			}
		});
		if (updateResult.modifiedCount == 0) {
			throw error(500, "Error Updating: ")
		}
		return {success: true}
	}
}