import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Analysis, SessionSnapshot} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from './$types'

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
		console.log(sessions)

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