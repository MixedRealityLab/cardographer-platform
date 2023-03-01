import {getDb} from "$lib/db";
import {cleanRevisions} from "$lib/decks";
import type {CardDeckRevisionSummary, Session} from "$lib/types"
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({params}) {
	const {sessionId} = params
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({_id: sessionId})
	const decks = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		_id: {$in: session.decks.map((deck) => deck.deckId + ':' + deck.revision)}
	}).toArray()

	await cleanRevisions(decks, db)

	console.log(JSON.stringify(decks))

	session.decks = decks

	return session
}