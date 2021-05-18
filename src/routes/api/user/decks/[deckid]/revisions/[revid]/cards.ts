import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
  from '$lib/types.ts';
import type {PutCardsRequest} from '$lib/apitypes.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import parse from 'csv-parse';
import { readCards } from '$lib/csvutils.ts';

const debug = true;

export async function put(request): RequestHandler {
	const req = await request.body as PutCardsRequest;
	if (!req.csvFile) {
		if (debug) console.log(`no csvFile in PutCardsRequest`);
		return { status: 400 }
	}
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const {deckid,revid} = request.params;
	const db = await getDb();
	// permission check
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// current revision
	const revision = await db.collection('CardDeckRevisions').findOne({
		deckId: deckid, revision: Number(revid)
	}) as CardDeckRevision;
	if (!revision) {
		if (debug) console.log(`deck ${deckid} revision ${revid} not found`);
		return { status: 404 };
	}
	// parse CSV file
	const cells:string[][] = await new Promise((resolve,reject) => {
		parse(req.csvFile, { bom: true, columns: false, trim: true },
		(err, output) => {
			if (err) {
				if (debug) console.log(`csv error`, err);
				return { status: 400 };
			}
			//console.log(`csv:`, output);
			resolve(output);
		}); 
	});
	const addColumns = req.addColumns;
	// process update
	const newRevision = readCards( revision, cells, addColumns );
	// update revision
	const now = new Date().toISOString();
	const upd = await db.collection('CardDeckRevisions').updateOne({
                deckId: deckid, revision: Number(revid)
        }, { $set: {
		// project changes
		lastModified: now,
		cardCount: newRevision.cards.length,
		defaults: newRevision.defaults,
		cards: newRevision.cards,
		propertyDefs: newRevision.propertyDefs,
	}});
	if (!upd.matchedCount) {
		if (debug) console.log(`revision ${revid} not matched for deck ${deckid}`, upd);
		return { status: 404 };
	}
	return {
		body: {}
	}
}
  
