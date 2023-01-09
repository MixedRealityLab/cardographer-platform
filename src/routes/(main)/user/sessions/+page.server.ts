import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Session} from "$lib/types";
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions')
		.find({owners: locals.email})
		.sort({"name": 1, "owners[0]": 1, "created": 1, "_id": 1})
		.toArray()
	return {
		sessions: sessions
	}
}