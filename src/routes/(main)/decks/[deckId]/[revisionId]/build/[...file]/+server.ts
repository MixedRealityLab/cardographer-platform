import {deleteFile} from "$lib/builders";
import {getDb} from "$lib/db";
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit"
import { verifyLocalUserIsDeckBuilder } from "$lib/userutils";
import { getDiskSizeK } from "$lib/builders";
import { type CardDeckRevision } from "$lib/types";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals)
	await verifyLocalUserIsDeckBuilder(locals)
	const {deckId, revisionId, file} = params;
	const db = await getDb();
	const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
	if (revision.isLocked) {
		throw error(401, "Deck " + revision.deckName + " is locked")
	}
	await deleteFile(deckId, revisionId, file)
	const diskSizeK = await getDiskSizeK(revision.deckId, String(revision.revision))
	console.log(`after delete disk size is ${diskSizeK}`)
	await db.collection<CardDeckRevision>("CardDeckRevisions").updateOne({
	    _id: revision._id
	}, {
		$set: {
			diskSizeK: diskSizeK,
		}
	})
	return json({success: true})
}