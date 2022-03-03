import type {PostFilesRequest} from '$lib/apitypes';
import {deleteFile, getFileInfo, writeFile} from '$lib/builders/index';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import path from 'path'

const debug = true;

export const get: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
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
		return {status: 404};
	}
	try {
		const files = await getFileInfo(deckId, revisionId, file);
		return {
			body: files as any[]
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${file}: ${err.message}`);
		return {status: 500}
	}
}

export const post: RequestHandler = async function ({locals, params, request}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
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
		return {status: 404};
	}
	// revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return {status: 404};
	}
	if (revision.isLocked) {
		if (debug) console.log(`revision ${revisionId} for ${deckId} locked`)
		return {status: 401};
	}
	const path = params.file;

	for (const file of req.files) {
		if (debug) console.log(`upload ${file.name}`);
		await writeFile(deckId, revisionId, path, file.name, file.content);
	}
	try {
		const files = await getFileInfo(deckId, revisionId, path);
		return {
			body: files as any[]
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${path}: ${err.message}`);
		return {status: 500}
	}
}

export const del = async function ({locals, params}) {
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
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
		return {status: 404};
	}
	// revision
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return {status: 404};
	}
	if (revision.isLocked) {
		if (debug) console.log(`revision ${revisionId} for ${deckId} locked`)
		return {status: 401};
	}
	await deleteFile(deckId, revisionId, file)
	const parent = path.dirname(file)
	try {
		const files = await getFileInfo(deckId, revisionId, parent);
		return {
			body: files as any[]
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${path}: ${err.message}`);
		return {status: 500}
	}
}
