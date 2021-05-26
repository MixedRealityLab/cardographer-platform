import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
  from '$lib/types.ts';
import type {BuildResponse} from '$lib/apitypes.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import {buildRevision} from '$lib/builders/index.ts'

const debug = true;

export async function post(request): RequestHandler {
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
	if (!revision.build) {
	       	if (debug) console.log(`deck ${deckid} revision ${revid} not set up to build`);
		return { status: 403 }
	}
	if (revision.build.isDisabled) {
		if (debug) console.log(`deck ${deckid} revision ${revid} build is disabled`);
	       	return { status: 403 }
	}
	// build...
	const result = await buildRevision( revision );	
	// update revision
	if (!result.error && result.cards) {
		for (let card of result.cards) {
			const update = revision.cards.find((c) => c.id == card.id);
			if (!update) {
				console.log(`Error: could not find card ${card.id} to update`);
				continue;
			}
			for (const k in card) {
				update[k] = card[k];
			}
		}
	}
	const now = new Date().toISOString();
	const upd = await db.collection('CardDeckRevisions').updateOne({
                deckId: deckid, revision: Number(revid)
        }, { $set: {
		// project changes
		lastModified: now,
		cards: revision.cards,
		'build.messages': result.messages,
		'build.status': (result.error ? 'failed' : 'built'),
		'build.lastBuilt': now,
		output: { 
			isUserModified: false,
			atlases: result.atlases
		}
	}});
	if (!upd.matchedCount) {
		if (debug) console.log(`revision ${revid} not matched for deck ${deckid}`, upd);
		return { status: 404 };
	}
	return {
		body: result
	}
}
  
