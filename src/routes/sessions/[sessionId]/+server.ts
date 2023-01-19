import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Session} from "$lib/types"
import {error, json} from "@sveltejs/kit";
import type {RequestHandler} from "@sveltejs/kit"

export const DELETE: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {sessionId} = params;
	const db = await getDb();
	const analysis = await db.collection<Session>('Sessions').deleteOne({
		_id: sessionId, owners: locals.email
	})
	if (analysis.deletedCount == 0) {
		throw error(404);
	}

	return json({})
}