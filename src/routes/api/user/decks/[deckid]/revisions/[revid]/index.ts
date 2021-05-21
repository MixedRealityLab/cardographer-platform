import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function put(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const revision = request.body as CardDeckRevision;
	const {deckid,revid} = request.params;
	if (deckid != revision.deckId || revid != String(revision.revision)) {
		if (debug) console.log(`revision doesnt match url`, revision);
		return { status: 400 };
	}
	if (debug) console.log(`get revision ${revid} for ${deckid}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// update revision
	const now = new Date().toISOString();
	const upd = await db.collection('CardDeckRevisions').updateOne({
                deckId: deckid, revision: Number(revid)
        }, { $set: {
		// project changes
		slug: revision.slug,
		deckName: revision.deckName,
		deckDescription: revision.deckDescription,
		deckCredits: revision.deckCredits,
		lastModified: now,
		revisionName: revision.revisionName,
		revisionDescription: revision.revisionDescription,
		isUsable: revision.isUsable,
		isPublic: revision.isPublic,
		isLocked: revision.isLocked,
		isTemplate: revision.isTemplate,
		// others should get set in other ways
	}});
	if (!upd.matchedCount) {
		if (debug) console.log(`revision ${revid} not matched for deck ${deckid}`, upd);
		return { status: 404 };
	}
	// update deck summary
	const upd2 = await db.collection('CardDeckSummaries').updateOne({
		_id: deckid
        }, { $set: {
		name: revision.deckName,
		description: revision.deckDescription,
		credits: revision.deckCredits,
	}});
	if (!upd2.matchedCount) {
		if (debug) console.log(`deck ${deckid} update failed`, upd);
	}
	return {
		body: {}
	}
}
  
