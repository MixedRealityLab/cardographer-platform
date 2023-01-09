import {base} from '$app/paths'
import type {FileInfo} from '$lib/apitypes'
import type {CardDeckRevision} from "$lib/types"
import {authenticateRequest, errorResponses} from "$lib/ui/token"
import type {PageLoad} from '@sveltejs/kit'

export const load: PageLoad = async function ({params, fetch, session}) {
	const {deckId, revisionId, file} = params
	const path = file.length > 0 ? '/' + file : ''
	const authHeader = authenticateRequest(session)
	const responses = await Promise.all([
		fetch(`${base}/api/user/decks/${deckId}/${revisionId}/files${path}`, authHeader),
		fetch(`${base}/api/user/decks/${deckId}/${revisionId}`, authHeader)
	])

	if (responses.every((res) => res.ok)) {
		return {
			files: await responses[0].json() as FileInfo[],
			revision: await responses[1].json() as CardDeckRevision
		}
	}
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponses(responses)
}
