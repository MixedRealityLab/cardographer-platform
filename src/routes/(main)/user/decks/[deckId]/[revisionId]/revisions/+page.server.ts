import {getDb} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {CardDeckSummary} from "$lib/types"
import type {PageServerLoad} from "./$types"
export const load: PageServerLoad = async function ({locals}) {
	verifyAuthentication(locals)
	const db = await getDb();
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries')
		.find({owners: locals.email})
		.sort({"name": 1, "_id": 1})
		.toArray()
	return {
		decks: decks
	}
}