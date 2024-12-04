import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import {CardDeckRevision, CardDeckSummary} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";
import {rm} from "fs/promises";

// noinspection JSUnusedGlobalSymbols
export const DELETE: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals)
	const {deckId,revisionId} = params;
	const revision = Number(revisionId)
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		throw error(404, `Deck ${deckId} not found`);
	}
	const revisionsLeft = await db.collection<CardDeckRevision>('CardDeckRevisions').countDocuments({
		deckId: deckId
	})
	if (revisionsLeft == 1) {
		console.log(`refusing to delete last revision of deck ${deckId}/${revision} - delete the deck`)
		throw error(400, `Deck ${deckId} has no other revisions`);
	} 
	const deleteResult = await db.collection<CardDeckRevision>('CardDeckRevisions').deleteMany({
		deckId: deckId, revision: revision
	})
	if(deleteResult.deletedCount === 0) {
		throw error(404, `Revision ${deckId}/${revision} not found`);
	}
	try {
		await rm('/app/uploads/' + deckId + '/' + revision, {recursive: true, force: true})
	}
	catch (err){ 
		console.log(`Possible error deleting deck ${deckId} files: ${err.message}`)
	}
	if (deck.currentRevision == revision) {
		console.log(`Note, delete current revision of deck ${deckId}`)
		// fix summary???
		let revisions = await db.collection<CardDeckRevision>('CardDeckRevisions').find({
			deckId: deckId
		}, { 
			projection: {
				_id: true, deckId: true, revision: true, isUsable: true, isPublic: true,
				isLocked: true, isTemplate: true, cardCount: true, diskSizeK: true,
			}
		}).toArray()
		revisions.sort((a,b) => b.revision - a.revision)
		console.log(`Max revision: ${revisions[0].revision} => current`)
		const maxRevision = revisions[0].revision
		await db.collection<CardDeckSummary>('CardDeckSummaries').updateOne({
				_id: deckId, 
			}, { 
			$set: {
				currentRevision: maxRevision
			}
		});
	}

	return json({success: true})
}