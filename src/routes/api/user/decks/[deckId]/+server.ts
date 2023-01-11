import { json } from '@sveltejs/kit';
import {getDb} from "$lib/db";
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevisionSummary, CardDeckSummary} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {promises as fs} from "fs";

const debug = true

export const del: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const {deckId} = params;
	if (debug) console.log(`get revisions for ${deckId}`)
	const db = await getDb();
	// permission check
	const deleteResult = await db.collection<CardDeckSummary>('CardDeckSummaries').deleteOne({
		_id: deckId, owners: locals.email
	})
	if(deleteResult.deletedCount === 0) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').deleteMany({
		deckId: deckId
	})

	await fs.rm('/app/uploads/' + deckId, {recursive: true, force: true})

	return json({})
}