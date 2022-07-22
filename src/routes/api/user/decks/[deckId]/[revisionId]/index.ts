import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {deckId, revisionId} = params;
	if (debug) console.log(`get revision ${revisionId} for ${deckId}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return {status: 404};
	}
	// project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return {status: 404};
	}
	revision.isCurrent = revision.revision == deck.currentRevision;
	return {
		body: revision as any
	}
}

export const PUT: RequestHandler = async function ({locals, params, request}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const revision = await request.json() as CardDeckRevision;
	const {deckId, revisionId} = params;
	if (deckId != revision.deckId || revisionId != String(revision.revision)) {
		if (debug) console.log(`revision doesnt match url`, revision);
		return {status: 400};
	}
	if (debug) console.log(`get revision ${revisionId} for ${deckId}`);
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
		deckId: deckId, revision: Number(revisionId)
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
		if (debug) console.log(`revision ${revisionId} not matched for deck ${deckId}`, upd);
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
  
