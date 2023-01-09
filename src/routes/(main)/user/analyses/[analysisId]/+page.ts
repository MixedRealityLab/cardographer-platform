import {base} from '$app/paths'
import type {Analysis} from "$lib/types";
import {authenticateRequest, errorResponses} from "$lib/ui/token";
import type {PageLoad} from '@sveltejs/kit';

export const load: PageLoad = async function ({params, fetch, session}) {
	const requestInfo = authenticateRequest(session)
	const {analysisId} = params;
	const responses = await Promise.all([
		fetch(`${base}/api/user/analyses/${analysisId}`, requestInfo),
		fetch(`${base}/api/user/users`, requestInfo)
	])
	if (responses.every((res) => res.ok)) {
		const users = await responses[1].json()
		return {
			analysis: await responses[0].json(),
			users: users.values
		}
	}
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponses(responses)
}
