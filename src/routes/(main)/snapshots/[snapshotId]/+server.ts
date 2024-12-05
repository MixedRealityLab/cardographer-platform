import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {SessionSnapshot} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {snapshotId} = params;
	const db = await getDb();
	const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots').deleteOne({
		_id: snapshotId, owners: locals.email
	})
	if (snapshot.deletedCount == 0) {
		throw error(404);
	}

	return json({})
}