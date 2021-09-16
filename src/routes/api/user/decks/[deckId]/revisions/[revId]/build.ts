import {buildRevision} from '$lib/builders'
import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function post(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const {deckId, revId} = request.params;
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return {status: 404};
	}
	// current revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revId)
	})
	if (!revision) {
		if (debug) console.log(`deck ${deckId} revision ${revId} not found`);
		return {status: 404};
	}
	if (!revision.build) {
		if (debug) console.log(`deck ${deckId} revision ${revId} not set up to build`);
		return {status: 403}
	}
	if (revision.build.isDisabled) {
		if (debug) console.log(`deck ${deckId} revision ${revId} build is disabled`);
		return {status: 403}
	}
	// build...
	const result = await buildRevision(revision);
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
	const upd = await db.collection<CardDeckRevision>('CardDeckRevisions').updateOne({
		deckId: deckId, revision: Number(revId)
	}, {
		$set: {
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
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`revision ${revId} not matched for deck ${deckId}`, upd);
		return {status: 404};
	}
	return {
		body: result as any
	}
}
  
