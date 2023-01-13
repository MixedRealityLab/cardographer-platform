import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {SessionSnapshot} from "$lib/types";
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, parent}) {
	verifyAuthentication(locals)
	const analysis = await parent()
	const db = await getDb()
	const snapshots = await db.collection<SessionSnapshot>('SessionSnapshots')
		.find({
			$or: [{owners: locals.email}, {isPublic: true}]
		}, {
			projection: {
				_id: true, sessionId: true, sessionName: true,
				sessionDescription: true, sessionCredits: true,
				sessionType: true, originallyCreated: true,
				snapshotDescription: true
			}
		})
		.sort({sessionName: 1, originallyCreated: 1})
		.toArray()
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