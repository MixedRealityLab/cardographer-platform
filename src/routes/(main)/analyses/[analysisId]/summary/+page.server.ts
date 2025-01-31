import {readDesigns} from '$lib/analysis'
import type {BoardInfo} from "$lib/analysistypes";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {CardDeckRevision, Session} from '$lib/types';
import type {PageServerLoad} from "./$types"

function onlyUnique(value, index, array) {
	return array.indexOf(value) === index;
}

interface Board {
	session: Session
	snapshotDescription: string
	boardId: string
	board: BoardInfo
	created: string
}

function compareBoards(a, b) {
	return `${a.sessionName}/${a.created}/${a.boardId}`.localeCompare(`${b.sessionName}/${b.created}/${b.boardId}`)
}

/** @type {import('./$types').PageServerLoad} */
export const load: PageServerLoad = async function ({locals, parent}) {
	await verifyAuthentication(locals)
	const analysis = await parent()
	const db = await getDb();
	const designs = await readDesigns(analysis)
	const sessionIds = designs.map((d) => d.session._id).sort().filter(onlyUnique)
	const sessions = sessionIds.map((id) => designs.find((d) => d.session._id == id).session)
	const boards: Board[] = designs.flatMap((d) => d.boards.map((b) => {
		return {
			session: d.session,
			snapshotDescription: d.snapshot.snapshotDescription,
			boardId: b.id,
			board: b,
			created: d.snapshot.created,
		}
	})).sort(compareBoards)
	let decks: CardDeckRevision[] = []
	for (const session of sessions) {
		for (const sessionDeck of session.decks) {
			let deck = decks.find((d) => d.deckId == sessionDeck.deckId && d.revision == sessionDeck.revision)
			if (!deck) {
				deck = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
					deckId: sessionDeck.deckId,
					revision: sessionDeck.revision
				})
				if (!deck) {
					console.log(`could not find deck ${sessionDeck.deckId} ${sessionDeck.revision}`)
				}
			}
			if (deck && deck.cards) {
				decks.push(deck)
			}
		}
	}
	return {
		analysis: analysis,
		designs: designs,
		boardIds: designs.flatMap((d) => d.boards.map((b) => b.id)).sort().filter(onlyUnique),
		zoneIds: designs.flatMap((d) => d.boards.flatMap((b) => b.zones.map((z) => z.id))).sort().filter(onlyUnique),
		boards: boards,
		sessionIds,
		sessions,
		decks,
		deckCardIds: decks.flatMap((d) => d.cards.map((c) => c.id)).sort().filter(onlyUnique),
		usedCardIds: designs.flatMap((d) => d.boards.flatMap((b) => b.cards.map((c) => c.id))).sort().filter(onlyUnique),
	}
}
