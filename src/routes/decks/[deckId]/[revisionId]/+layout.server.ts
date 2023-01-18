import {getDb} from "$lib/db";
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {LayoutServerLoad} from "./$types"

export const load: LayoutServerLoad = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {deckId, revisionId} = params;
	const db = await getDb();
	return await getRevision(db, deckId, Number(revisionId), locals.email)
}
