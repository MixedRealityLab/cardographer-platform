import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Session,SessionSnapshot} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {sessionId} = params;
	const db = await getDb();
	const analysis = await db.collection<Session>('Sessions').deleteOne({
		_id: sessionId, owners: locals.email
	})
	if (analysis.deletedCount == 0) {
		throw error(404);
	}
	// delete all linked Snapshots
	await db.collection<SessionSnapshot>('SessionSnapshots').deleteMany({
		sessionId: sessionId
	})
	return json({})
}