import {getDb,getNewId} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision } from '$lib/types.ts';
import { DeckBuildStatus } from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import {copyBuild} from '$lib/builders/index.ts';

const debug = true;

export async function post(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	let revision = request.body as CardDeckRevision;
	//if (debug) console.log(`add deck`, revision);
	const db = await getDb();
	// check deck & access
	const {deckid} = request.params;
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// new revision...
	deck.currentRevision++;
	const revid = deck.currentRevision;
	const oldRevisionId = revision._id;
	const now = new Date().toISOString();
	// existing local revision?
	const oldRevision = await db.collection('CardDeckRevisions').findOne({
		_id:oldRevisionId
	}) as CardDeckRevision;
	// sanitise revision
	revision.deckId = deckid;
	revision.revision = revid;
	revision._id = `${deckid}:${revid}`;
	revision.slug = '';
	revision.created = revision.lastModified = now;
	revision.isUsable = false;
	revision.isPublic = false;
	revision.isLocked = false;
	revision.isTemplate = false;
	delete revision.isCurrent;
	if (oldRevision) {
		if (debug) console.log(`copying build from existing revision ${oldRevisionId}`);
		revision.build = await copyBuild( oldRevision, revision );
	} else if (revision.build) {
		if (debug) console.log(`cannot copy build - old revision ${oldRevisionId} not found`);
		delete revision.build.lastBuilt;
		revision.build.status = DeckBuildStatus.Unbuilt;
		revision.build.messages = [];
	}
	// add
	let result = await db.collection('CardDeckRevisions').insertOne(revision);
	if (!result.insertedCount) {
		console.log(`Error adding revision for new deck ${deckid}`);
		return { status: 500 };
	}
	// update deck
	result = await db.collection('CardDeckSummaries').updateOne({
		_id: deckid
	},{ $set: {
		currentRevision: deck.currentRevision
	}});
	if (!result.modifiedCount) {
		console.log(`Error updating deck ${deck._id} on new revision`);
	}
	return {
		body: { 
			revid: revid
		}
	}
}
  
