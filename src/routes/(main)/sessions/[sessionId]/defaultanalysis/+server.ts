import {getDb, getNewId} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Analysis,Session} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit";

// noinspection JSUnusedGlobalSymbols
export const POST: RequestHandler = async function ({locals,request,params}) {
	verifyAuthentication(locals)
	const {sessionId} = params;
	const {snapshotId} = await request.json()
    if (!snapshotId) {
        throw error(400, 'defaultanalysis requires {snapshotId}');
    }
	const db = await getDb();
    const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		throw error(404);
	}

	const analysis:Analysis = await db.collection<Analysis>('Analyses').findOne({
		defaultForSessionId: sessionId, owners: locals.email
	})
    const now = new Date().toISOString()
    if (!analysis) {
		const newId = getNewId()
		const result = await db.collection<Analysis>('Analyses').insertOne({
			_id: newId,
			name: `Default for ${session.name}`,
			description: `Default analysis from ${session.description}`,
			credits: '',
			created: now,
			lastModified: now,
			owners: [locals.email],
			isPublic: false,
			snapshotIds: [snapshotId],
			regions: [],
            defaultForSessionId: sessionId,
		});
		if (!result.insertedId) {
			throw error(500, 'Error adding default analysis');
		}
        return json({analysisId:newId})
    } else if (analysis.snapshotIds.indexOf(snapshotId)<0) {
		const updateResult = await db.collection<Analysis>('Analyses').updateOne({
			_id: analysis._id
		}, {
			$set: {
                snapshotIds: analysis.snapshotIds.concat([snapshotId]),
				lastModified: now
			}
		})
		if (updateResult.modifiedCount == 0) {
			throw error(500, "Error Updating default analysis")
		}
    }
	return json({analysisId:analysis._id})
}
