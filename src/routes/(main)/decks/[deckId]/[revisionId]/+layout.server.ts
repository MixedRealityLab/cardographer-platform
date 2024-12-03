import {getDb} from "$lib/db";
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import { getUser } from "$lib/userutils";
import type { User } from "$lib/types";

export const load: LayoutServerLoad = async function ({locals, params}) {
	verifyAuthentication(locals, true, true)
	const {deckId, revisionId} = params;
	const db = await getDb();
	const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
	return {
		revision,
	}
}
