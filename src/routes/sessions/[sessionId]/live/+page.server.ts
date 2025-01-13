import {error} from "@sveltejs/kit";
import type {PageServerLoad} from './$types'
import {getDb} from "$lib/db";
import type {CardDeckRevisionSummary, Session, User} from "$lib/types"
import {cleanRevisions} from "$lib/decks";
import {getUser, isLocalUserDisabled} from '$lib/userutils';

export const load: PageServerLoad = async function ({locals, params, url}) {
	const {sessionId} = params
	const db = await getDb();
	// (NO deck-pseudo sessions here!)
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({_id: sessionId})
	if (!session) {
		throw error(404, `Session ${sessionId} not found`)
	}
	const joiningCode = url.searchParams.get('j')
	if (!joiningCode) {
		throw error(401, `No joining code`)
	}
	if (!session.isLive || (joiningCode !== session.joiningCode && joiningCode !== session.joiningCodeReadonly)) {
		throw error(403, `Session ${sessionId} cannot be joined`)
	}
	const readonly = joiningCode !== session.joiningCode
	let decks = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		_id: {$in: session.decks.map((deck) => deck.deckId + ':' + deck.revision)}
	}).toArray()

	await cleanRevisions(decks, db)
	session.decks = decks

	let localUser : User|null = null
	if (locals.authenticated && locals.email && !(await isLocalUserDisabled(locals))) {
		localUser = await getUser(db, locals.email, locals.email)
	}
	const isOwner = session.owners?.indexOf(locals.email) >= 0
	return {
		session,
		readonly,
		localUser,
		isOwner,
	}
}