import {buildRevision} from '$lib/builders'
import {getDb} from '$lib/db'
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types'
import {DeckBuildStatus} from "$lib/types";
import type {RequestHandler} from '@sveltejs/kit'

const debug = true;

export const POST: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {deckId, revisionId} = params
	const db = await getDb()
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
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`deck ${deckId} revision ${revisionId} not found`);
		return {status: 404};
	}
	if (!revision.build) {
		revision.build = {
			builderId: "squib",
			builderName: "squib",
			isDisabled: false,
			status: DeckBuildStatus.Unbuilt

		}
		//if (debug) console.log(`deck ${deckId} revision ${revisionId} not set up to build`);
		//return {status: 401}
	}
	if (revision.build.isDisabled) {
		if (debug) console.log(`deck ${deckId} revision ${revisionId} build is disabled`);
		return {status: 401}
	}
	// build...
	revision.build.status = DeckBuildStatus.Building
	await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
	try {
		const result = await buildRevision(revision)
		// update revision
		if (!result.error && result.cards) {
			for (const card of result.cards) {
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
		revision.build.status = (result.error ? DeckBuildStatus.Failed : DeckBuildStatus.Built)
		revision.build.messages = result.messages
		revision.build.lastBuilt = now
		revision.lastModified = now
		revision.output = {isUserModified: false, atlases: result.atlases}
		const upd = await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
		if (!upd.matchedCount) {
			if (debug) console.log(`revision ${revisionId} not matched for deck ${deckId}`, upd);
			return {status: 404};
		}
		return {
			body: result as any
		}
	} catch (e) {
		revision.build.status = DeckBuildStatus.Failed
		revision.build.messages = ["Build Failed", e.toString()]
		const now = new Date().toISOString();
		revision.build.lastBuilt = now
		revision.lastModified = now
		const upd = await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
		if (!upd.matchedCount) {
			if (debug) console.log(`revision ${revisionId} not matched for deck ${deckId}`, upd);
			return {status: 404};
		}
		return {
			body: {},
			status: 500
		}
	}
}
  