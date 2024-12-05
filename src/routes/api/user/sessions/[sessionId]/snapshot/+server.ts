import {getDb} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {SessionSnapshot} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals, false)
	const {sessionId} = params;
	const db = await getDb();
	const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots').findOne({sessionId: sessionId});
	if (!snapshot) {
		throw error(404)
	}

	return json(snapshot)
}