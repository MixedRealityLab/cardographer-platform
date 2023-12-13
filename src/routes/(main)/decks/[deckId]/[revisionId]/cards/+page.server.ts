import {readCards} from "$lib/csvutils";
import {getDb} from "$lib/db";
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision} from "$lib/types";
import type {Actions} from "@sveltejs/kit";
import {error} from "@sveltejs/kit";
import {parse} from "csv";

const debug = true

export const actions: Actions = {
	default: async ({locals, params, request}) => {
		verifyAuthentication(locals)
		const data = await request.formData();
		const csv = data.get('files') as File
		const {deckId, revisionId} = params;
		const db = await getDb();
		// permission check
		const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
		if (!revision.isOwnedByUser) {
			throw error(401, `Deck Write Access Not Permitted`);
		}
		// parse CSV file
		const csvText = await csv.text()
		console.log(csvText)
		const cells: string[][] = await new Promise((resolve) => {
			parse(csvText, {bom: true, columns: false, trim: true},
				(err, output) => {
					if (err) {
						if (debug) console.log(`csv error`, err);
						return {status: 400};
					}
					//console.log(`csv:`, output);
					resolve(output);
				});
		});
		const addColumns = true // req.addColumns;
		//console.log("Add Columns: " + req.addColumns)
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
			return new Response(undefined, {status: 404});
		}
		return result
	}
}