import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {rm} from "fs/promises";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {deckId} = params;
	const db = await getDb();
	// permission check
	const deleteResult = await db.collection<CardDeckSummary>('CardDeckSummaries').deleteOne({
		_id: deckId, owners: locals.email
	})
	if(deleteResult.deletedCount === 0) {
		throw error(404, `Deck ${deckId} not found`);
	}
	await db.collection<CardDeckRevision>('CardDeckRevisions').deleteMany({
		deckId: deckId
	})
	console.log(`Note, deleting deck ${deckId}`)
	try {
		await rm('/app/uploads/' + deckId, {recursive: true, force: true})
	}
	catch (err){ 
		console.log(`Possible error deleting deck ${deckId} files: ${err.message}`)
	}

	return json({success: true})
}