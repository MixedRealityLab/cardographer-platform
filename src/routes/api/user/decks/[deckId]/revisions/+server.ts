import {getDb} from '$lib/db'
import {cleanRevision} from "$lib/decks";
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'
import {json as json$1} from '@sveltejs/kit';

const debug = true;

export const get: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, {status: 401})
	}
	const {deckId} = params;
	if (debug) console.log(`get revisions for ${deckId}`)
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, {status: 404});
	}
	// project to summary
	const revisions = await db.collection<CardDeckRevisionSummary>('CardDeckRevisions').find({
		deckId: deckId
	}, {
		projection: {
			_id: true, deckId: true, revision: true, slug: true, deckName: true,
			deckDescription: true, deckCredits: true, created: true,
			lastModified: true, revisionName: true,
			revisionDescription: true, isUsable: true, isPublic: true,
			isLocked: true, isTemplate: true, cardCount: true
		}
	}).toArray()
	const current = revisions.find((r) => r.revision == deck.currentRevision);
	if (current) {
		current.isCurrent = true;
	}
	if (debug) console.log(`found ${revisions.length} revisions for ${deckId}`);
	return json$1({
		revisions: revisions as any[]
	})
}

export const post: RequestHandler = async function ({locals, params, request}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, {status: 401})
	}
	const revision = await request.json() as CardDeckRevision;
	//if (debug) console.log(`add deck`, revision);
	const db = await getDb();
	// check deck & access
	const {deckId} = params;
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, {status: 404});
	}
	// new revision...
	deck.currentRevision++;
	const revId = deck.currentRevision;
	await cleanRevision(db, revision, deckId, revId)
	// add
	const insertResult = await db.collection<CardDeckRevision>('CardDeckRevisions').insertOne(revision);
	if (!insertResult.acknowledged) {
		console.log(`Error adding revision for new deck ${deckId}`);
		return new Response(undefined, {status: 500});
	}
	// update deck
	const updateResult = await db.collection<CardDeckSummary>('CardDeckSummaries').updateOne({
		_id: deckId
	}, {
		$set: {
			currentRevision: deck.currentRevision
		}
	});
	if (!updateResult.modifiedCount) {
		console.log(`Error updating deck ${deck._id} on new revision`);
	}
	return json$1({
		revId: revId
	})
}

