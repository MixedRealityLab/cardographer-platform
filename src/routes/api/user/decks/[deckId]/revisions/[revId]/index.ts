import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function put(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const revision = request.body as unknown as CardDeckRevision;
	const {deckId, revId} = request.params;
	if (deckId != revision.deckId || revId != String(revision.revision)) {
		if (debug) console.log(`revision doesnt match url`, revision);
		return {status: 400};
	}
	if (debug) console.log(`get revision ${revId} for ${deckId}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return {status: 404};
	}
	// update revision
	const now = new Date().toISOString();
	const upd = await db.collection<CardDeckRevision>('CardDeckRevisions').updateOne({
		deckId: deckId, revision: Number(revId)
	}, {
		$set: {
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
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`revision ${revId} not matched for deck ${deckId}`, upd);
		return {status: 404};
	}
	// update deck summary
	const upd2 = await db.collection<CardDeckSummary>('CardDeckSummaries').updateOne({
		_id: deckId
	}, {
		$set: {
			name: revision.deckName,
			description: revision.deckDescription,
			credits: revision.deckCredits,
		}
	});
	if (!upd2.matchedCount) {
		if (debug) console.log(`deck ${deckId} update failed`, upd);
	}
	return {
		body: {}
	}
}
  
