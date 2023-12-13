import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import { checkSessionSnapshotCredits } from "$lib/sessions";
import type {Analysis, SessionSnapshot, Session} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, parent}) {
	verifyAuthentication(locals)
	const analysis = await parent()
	const db = await getDb()
	let snapshots = await db.collection<SessionSnapshot>('SessionSnapshots')
		.find({
			$or: [{owners: locals.email}, {isPublic: true}], isNotForAnalysis: false,
		}, {
			projection: {
				_id: true, sessionId: true, sessionName: true, owners: true,
				sessionDescription: true, sessionCredits: true,
				sessionType: true, created: true,
				snapshotDescription: true
			}
		})
		.sort({sessionId: 1, created: 1})
		.toArray()
	// link to sessions (for consent information)
	const sessions = await db.collection<Session>('Sessions')
			.find({_id: {$in: snapshots.map((snapshot) => snapshot.sessionId)}})
			.toArray();
	snapshots.forEach((snapshot) => snapshot.session = sessions.find((session) => session._id == snapshot.sessionId))
	// skip if no session (should have been deleted but wasn't?!)
	snapshots = snapshots.filter((s) => !!s.session)
	if (snapshots && analysis && analysis.snapshotIds) {
		snapshots.forEach((snapshot) => {
			snapshot.selected = analysis.snapshotIds.some((id) => id == snapshot._id)
		})
	}
	snapshots.forEach((snapshot) => snapshot.isOwnedByUser = snapshot.owners.includes(locals.email))
	await checkSessionSnapshotCredits(snapshots, db)
	return {
		analysis: analysis,
		snapshots: snapshots
	}
}

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {analysisId} = params
		const db = await getDb()
		const analysis = await db.collection<Analysis>('Analyses').findOne({
			_id: analysisId, owners: locals.email
		})
		if (!analysis) {
			throw error(404, `Analysis ${analysisId} not found`);
		}

		const data = await request.formData();
		let sessions = data.getAll('sessions') as string[]
		const updateResult = await db.collection<Analysis>('Analyses').updateOne({
			_id: analysisId
		}, {
			$set: {
				snapshotIds: sessions,
				lastModified: new Date().toISOString()
			}
		})
		if (updateResult.modifiedCount == 0) {
			throw error(500, "Error Updating: ")
		}
		return {success: true}
	}
}