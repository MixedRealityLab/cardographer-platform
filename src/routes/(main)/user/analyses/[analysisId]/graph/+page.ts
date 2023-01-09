import {base} from '$app/paths'
import type {Analysis} from "$lib/types";
import {authenticateRequest, errorResponse} from "$lib/ui/token";
import type {PageLoad} from './$types';

export const load: PageLoad = async function ({params, fetch}) {
	const {analysisId} = params;
	const res = await fetch(`${base}/api/user/analyses/${analysisId}`, authenticateRequest(session));
	if (res.ok) {
		return {
			analysis: await res.json() as Analysis
		}
	}

	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponse(res)
}
