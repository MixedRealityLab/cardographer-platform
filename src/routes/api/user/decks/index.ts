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
	// new deck id
	const deckid = getNewId();
	const revid = 1;
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
	const deck : CardDeckSummary = {
		_id: deckid,
		name: revision.deckName,
		description: revision.deckDescription,
		isPublic: false,
		owners: [ locals.email ],
		currentRevision: revid,
		credits: revision.deckCredits,
	};
	// add deck
	result = await db.collection('CardDeckSummaries').insertOne(deck);
	if (!result.insertedCount) {
		console.log(`Error adding new deck ${deckid}`);
		return { status: 500 };
	}
	console.log(`added deck ${deckid}`);

	return {
		body: { 
			deckid: deckid,
			revid: revid
		}
	}
}
  
