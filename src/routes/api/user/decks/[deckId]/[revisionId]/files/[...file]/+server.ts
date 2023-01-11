import type {PostFilesRequest} from '$lib/apitypes';
import {deleteFile, getFileInfo, writeToFile} from '$lib/builders';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {dirname} from 'path'

const debug = true;

export const get: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const {deckId, revisionId, file} = params;
	if (debug) console.log(`Get file ${deckId}/${revisionId}/${file}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`Deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	try {
		const files = await getFileInfo(deckId, revisionId, file);
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return new Response(files as any[]);
		return {
			body: files as any[]
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${file}: ${err.message}`);
		return new Response(undefined, { status: 500 })
	}
}

export const post: RequestHandler = async function ({locals, params, request}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const req = await request.json() as PostFilesRequest
	const {deckId, revisionId} = params
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	// revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return new Response(undefined, { status: 404 });
	}
	if (revision.isLocked) {
		if (debug) console.log(`revision ${revisionId} for ${deckId} locked`)
		return new Response(undefined, { status: 401 });
	}
	const path = params.file;

	for (const file of req.files) {
		if (debug) console.log(`upload ${file.name}`);
		await writeToFile(deckId, revisionId, path, file.name, file.content);
	}
	try {
		const files = await getFileInfo(deckId, revisionId, path);
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return new Response(files as any[]);
		return {
			body: files as any[]
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${path}: ${err.message}`);
		return new Response(undefined, { status: 500 })
	}
}

export const del = async function ({locals, params}) {
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return new Response(undefined, { status: 401 })
	}
	const {deckId, revisionId} = params;
	const file = params.file;
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	// revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return new Response(undefined, { status: 404 });
	}
	if (revision.isLocked) {
		if (debug) console.log(`revision ${revisionId} for ${deckId} locked`)
		return new Response(undefined, { status: 401 });
	}
	await deleteFile(deckId, revisionId, file)
	const parent = dirname(file)
	try {
		const files = await getFileInfo(deckId, revisionId, parent);
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return new Response(files as any[]);
		return {
			body: files as any[]
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${parent}: ${err.message}`);
		return new Response(undefined, { status: 500 })
	}
}
