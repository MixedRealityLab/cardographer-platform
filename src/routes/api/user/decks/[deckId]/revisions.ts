import {copyBuild} from '$lib/builders'
import {getDb} from '$lib/db'
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckRevisionSummary, CardDeckSummary} from '$lib/types'
import {DeckBuildStatus} from '$lib/types'
import type {RequestHandler} from '@sveltejs/kit'
import type {Db} from "mongodb"

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
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
		return {status: 404};
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
	return {
		body: {
			revisions: revisions as any[]
		}
	}
}

export const POST: RequestHandler = async function ({locals, params, request}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
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
		return {status: 404};
	}
	// new revision...
	deck.currentRevision++;
	const revId = deck.currentRevision;
	await cleanRevision(db, revision, deckId, revId)
	// add
	const insertResult = await db.collection<CardDeckRevision>('CardDeckRevisions').insertOne(revision);
	if (!insertResult.acknowledged) {
		console.log(`Error adding revision for new deck ${deckId}`);
		return {status: 500};
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
	return {
		body: {
			revId: revId
		}
	}
}

export async function cleanRevision(db: Db, revision: CardDeckRevision, deckId: string, revId: number) {
	const oldRevisionId = revision._id;
	const now = new Date().toISOString();
	// existing local revision?
	const oldRevision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		_id: oldRevisionId
	})
	// sanitise revision
	revision.deckId = deckId;
	revision.revision = revId;
	revision._id = `${deckId}:${revId}`;
	revision.slug = '';
	revision.created = revision.lastModified = now;
	revision.isUsable = false;
	revision.isPublic = false;
	revision.isLocked = false;
	revision.isTemplate = false;
	delete revision.isCurrent;
	if (oldRevision) {
		if (debug) console.log(`copying build from existing revision ${oldRevisionId}`);
		revision.build = await copyBuild(oldRevision, revision);
	} else if (revision.build) {
		if (debug) console.log(`cannot copy build - old revision ${oldRevisionId} not found`);
		delete revision.build.lastBuilt;
		revision.build.status = DeckBuildStatus.Unbuilt;
		revision.build.messages = [];
	}
}
  
