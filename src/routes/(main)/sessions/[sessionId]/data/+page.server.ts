import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Analysis, SessionSnapshot, Session} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, parent}) {
	await verifyAuthentication(locals)
	const db = await getDb()
	const session:Session = await parent()
    let snapshots = await db.collection<SessionSnapshot>('SessionSnapshots')
		.find({
			sessionId: session._id, owners: locals.email
		}, {
			projection: {
				_id: true, sessionId: true, 
				created: true, originallyCreated: true,
				snapshotDescription: true, isNotForAnalysis: true,
                sessionStage: true
			}
		})
		.sort({created: 1})
		.toArray()

    return {
		session: session,
		snapshots: snapshots
	}
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({request, locals, params}) => {
        await verifyAuthentication(locals)
		const {sessionId} = params
		const db = await getDb()
		const session = await db.collection<Session>('Sessions').findOne({
			_id: sessionId, owners: locals.email
		})
		if (!session) {
			throw error(404, `Session ${sessionId} not found`);
		}
        const formData = await request.formData();
        const snapshotIds = formData.getAll('id') as string[]
        for (let ix=0; ix<snapshotIds.length; ix++) {
            const snapshotId = snapshotIds[ix]
            const isNotForAnalysis = formData.get(`isNotForAnalysis-${snapshotId}`) == 'on'
            const updateResult = await db.collection<SessionSnapshot>('SessionSnapshots').updateOne(
                {_id: snapshotId},
                {
                    $set: {
                        snapshotDescription: formData.get(`description-${snapshotId}`) as string || '', 
                        isNotForAnalysis: isNotForAnalysis,
                    }
                })
            if (updateResult.matchedCount == 0) {
                throw error(500, `Error Updating snapshot ${snapshotId}`)
            }
        }
		return {success: true}
	}
};