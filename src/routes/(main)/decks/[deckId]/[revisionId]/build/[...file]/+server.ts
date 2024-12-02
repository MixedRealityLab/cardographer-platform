import {deleteFile} from "$lib/builders";
import {getDb} from "$lib/db";
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit"
import { verifyLocalUserIsDeckBuilder } from "$lib/userutils";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	verifyLocalUserIsDeckBuilder(locals)
	const {deckId, revisionId, file} = params;
	const db = await getDb();
	const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
	if (revision.isLocked) {
		throw error(401, "Deck " + revision.deckName + " is locked")
	}
	await deleteFile(deckId, revisionId, file)
	return json({success: true})
}