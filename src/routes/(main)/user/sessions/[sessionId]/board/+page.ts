import {base} from '$app/paths'
import {authenticateRequest, errorResponse} from "$lib/ui/token"
import type {PageLoad} from '@sveltejs/kit'

export const load: PageLoad = async function ({params, fetch, session}) {
	const {sessionId} = params
	const res = await fetch(`${base}/api/user/sessions/${sessionId}`, authenticateRequest(session))
	if (res.ok) {
		return {
			session: (await res.json())
		}
	}

	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponse(res)
}
