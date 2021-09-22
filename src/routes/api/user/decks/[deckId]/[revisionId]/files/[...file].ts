import type {PostFilesRequest} from '$lib/apitypes';
import {getFileInfo, writeFile} from '$lib/builders/index';
import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {EndpointOutput, Request, RequestHandler} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const {deckId, revisionId, file} = request.params;
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

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function post(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const req = await request.body as unknown as PostFilesRequest;
	const {deckId, revisionId} = request.params;
	const path = request.params.file;
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
		;
		return {status: 403};
	}
	for (let file of req.files) {
		if (debug) console.log(`upload ${file.name}`);
		await writeFile(deckId, revisionId, path, file.name, file.content);
	}
	return {
		body: {}
	}
}
