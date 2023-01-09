import {base} from '$app/paths'
import type {CardDeckRevisionSummary, Analysis, SessionSnapshotSummary} from "$lib/types"
import {authenticateRequest, errorResponses} from "$lib/ui/token"
import type {PageLoad} from '@sveltejs/kit';

interface SessionSelection extends SessionSnapshotSummary {
	selected: boolean
}

interface SessionSelection2 {
	sessionId: string
	snapshots: CardDeckRevisionSummary[]
	index: number
	selected: boolean
}

export const load: PageLoad = async function ({params, fetch, session}) {
	const headers = authenticateRequest(session)
	const {analysisId} = params
	const responses = await Promise.all([
		fetch(`${base}/api/user/analyses/${analysisId}`, headers),
		fetch(`${base}/api/user/snapshots`, headers)
	])

	if (responses.every((res) => res.ok)) {
		const analysis = await responses[0].json() as Analysis
		const snapshots = ((await responses[1].json()).values as SessionSelection[]).sort(compareSessions)
		if (snapshots && analysis && analysis.snapshotIds) {
			snapshots.forEach((snapshot) => {
				snapshot.selected = analysis.snapshotIds.some((id) => id == snapshot._id)
			})
		}

		return {
			analysis: analysis,
			snapshots: snapshots
		}
	}

	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292693)");
	return errorResponses(responses)
}

function compareSessions(a: SessionSelection, b: SessionSelection) {
	const aName = `${a.sessionName} ${a.originallyCreated}`
	const bName = `${b.sessionName} ${b.originallyCreated}`
	return String(aName).localeCompare(bName)
}
