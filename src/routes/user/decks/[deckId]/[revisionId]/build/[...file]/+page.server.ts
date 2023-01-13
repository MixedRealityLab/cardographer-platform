import {buildRevision, getFileInfo, writeToFile} from "$lib/builders";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import {DeckBuildStatus} from "$lib/types";
import type {CardDeckRevision, CardDeckSummary} from "$lib/types";
import {error, json} from "@sveltejs/kit";
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async function ({locals, params, parent}) {
	verifyAuthentication(locals)
	const {deckId, revisionId, file} = params
	const db = await getDb()
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		return error(404, `Deck ${deckId} not found`);
	}
	// project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		return error(404, `Deck ${deckId}/${revisionId} not found`);
	}
	revision.isCurrent = revision.revision == deck.currentRevision;

	try {
		const files = await getFileInfo(deckId, revisionId, file);
		return {
			revision: revision,
			files: files
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${file}: ${err.message}`);
		return new Response(undefined, {status: 500})
	}
}

export const actions: Actions = {
	default: async ({locals, params, request}) => {
		verifyAuthentication(locals)
		const {deckId, revisionId} = params
		const db = await getDb();
		// permission check
		const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
			_id: deckId, owners: locals.email
		})
		if (!deck) {
			throw error(404)
		}
		// revision
		const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
			deckId: deckId, revision: Number(revisionId)
		})
		if (!revision) {
			throw error(404)
		}
		if (revision.isLocked) {
			throw error(401)
		}
		const path = params.file;

		const data = await request.formData();
		const files = data.getAll('files') as File[]
		for (const file of files) {
			console.log(file)
			await writeToFile(deckId, revisionId, path, file);
		}
		try {
			return {success: true}
		} catch (err) {
			console.log(`error getting file ${deckId}/${revisionId}/${path}: ${err.message}`);
			throw error(500)
		}
	},
	build: async ({locals, params, request}) => {
		verifyAuthentication(locals)
		const {deckId, revisionId} = params
		const db = await getDb()
		// permission check
		const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
			_id: deckId, owners: locals.email
		})
		if (!deck) {
			return new Response(undefined, { status: 404 });
		}
		// current revision
		const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
			deckId: deckId, revision: Number(revisionId)
		})
		if (!revision) {
			return new Response(undefined, { status: 404 });
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
			return new Response(undefined, { status: 401 })
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
				return new Response(undefined, { status: 404 });
			}
			// Suggestion (check for correctness before using):
			// return new Response(result as any);
			return json(result)
		} catch (e) {
			revision.build.status = DeckBuildStatus.Failed
			revision.build.messages = ["Build Failed", e.toString()]
			const now = new Date().toISOString();
			revision.build.lastBuilt = now
			revision.lastModified = now
			const upd = await db.collection<CardDeckRevision>('CardDeckRevisions').replaceOne({_id: revision._id}, revision)
			if (!upd.matchedCount) {
				return new Response(undefined, { status: 404 });
			}
			return json({}, {
				status: 500
			})
		}
	}
}