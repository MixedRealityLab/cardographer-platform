import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Session} from "$lib/types"
import {error} from "@sveltejs/kit";
import type {LayoutServerLoad} from "./$types"

export const load: LayoutServerLoad = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {sessionId} = params
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		throw error(404);
	}
	return session
}
