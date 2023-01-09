import type {PutCardsRequest} from '$lib/apitypes';
import {readCards} from '$lib/csvutils';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security"
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import parse from 'csv-parse';

const debug = true;

export const put: RequestHandler = async function ({locals, request, params}) {
	const req = await request.json() as PutCardsRequest;
	if (!req.csvFile) {
		if (debug) console.log(`no csvFile in PutCardsRequest`);
		return new Response(undefined, { status: 400 })
	}
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const {deckId, revisionId} = params;
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`Deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	// current revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`deck ${deckId} revision ${revisionId} not found`);
		return new Response(undefined, { status: 404 });
	}
	// parse CSV file
	const cells: string[][] = await new Promise((resolve) => {
		parse(req.csvFile, {bom: true, columns: false, trim: true},
			(err, output) => {
				if (err) {
					if (debug) console.log(`csv error`, err);
					return {status: 400};
				}
				//console.log(`csv:`, output);
				resolve(output);
			});
	});
	const addColumns = req.addColumns;
	console.log("Add Columns: " + req.addColumns)
	// process update
	const newRevision = readCards(revision, cells, addColumns);
	// update revision
	const now = new Date().toISOString();
	const upd = await db.collection<CardDeckRevision>('CardDeckRevisions').updateOne({
		deckId: deckId, revision: Number(revisionId)
	}, {
		$set: {
			// project changes
			lastModified: now,
			cardCount: newRevision.cards.length,
			defaults: newRevision.defaults,
			//back: newRevision.back,
			cards: newRevision.cards,
			propertyDefs: newRevision.propertyDefs,
		}
	});
	const result = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!upd.matchedCount) {
		if (debug) console.log(`revision ${revisionId} not matched for deck ${deckId}`, upd);
		return new Response(undefined, { status: 404 });
	}
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
	// Suggestion (check for correctness before using):
	// return new Response(result as any);
	return {
		body: result as any
	}
}
  
