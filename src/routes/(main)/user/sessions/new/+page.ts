import {base} from '$app/paths'
import {authenticateRequest, errorResponse} from "$lib/ui/token";
import type {PageLoad} from '@sveltejs/kit';
import type {Session} from "$lib/types";

export const load: PageLoad = async function ({fetch, session}) {
	const res = await fetch(`${base}/api/user/sessions/templates`, authenticateRequest(session))
	if (res.ok) {
		return {
			sessions: (await res.json()).values.sort(compareSessions)
		}
	}

	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponse(res)
}

function compareSessions(a: Session, b: Session) {
	const aName = `${a.name} ${a.owners[0]} ${a.created}`;
	const bName = `${b.name} ${b.owners[0]} ${b.created}`;
	return String(aName).localeCompare(bName);
}
