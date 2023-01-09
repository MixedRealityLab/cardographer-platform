import {base} from '$app/paths'
import type {CardDeckRevisionSummary, Session} from "$lib/types";
import {authenticateRequest, errorResponses} from "$lib/ui/token";
import type {PageLoad} from '@sveltejs/kit';

interface DeckInfo {
	deckId: string
	revisions: CardDeckRevisionSummary[]
	index: number
	selected: boolean
}

export const load: PageLoad = async function ({params, fetch, session}) {
	const requestInfo = authenticateRequest(session)
	const {sessionId} = params;
	const responses = await Promise.all([
		fetch(`${base}/api/user/sessions/${sessionId}`, requestInfo),
		fetch(`${base}/api/user/decks/revisions`, requestInfo)
	])

	if (responses.every((res) => res.ok)) {
		const decks = ((await responses[1].json()).decks as CardDeckRevisionSummary[]).sort(compareDecks)
		let deckInfo: DeckInfo[] = []
		decks.forEach((revision) => {
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
		const sessionItem = await responses[0].json() as Session
		deckInfo.forEach((deckInfo) => {
			if (sessionItem.decks) {
				const sessionDeck = sessionItem.decks.find((sessionDeck) => sessionDeck.deckId == deckInfo.deckId)
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
			session: sessionItem,
			decks: deckInfo
		}
	}

	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponses(responses)
}

function compareDecks(a: CardDeckRevisionSummary, b: CardDeckRevisionSummary) {
	const aName = `${a.deckName} ${a.created}`;
	const bName = `${b.deckName} ${b.created}`;
	return String(aName).localeCompare(bName);
}
