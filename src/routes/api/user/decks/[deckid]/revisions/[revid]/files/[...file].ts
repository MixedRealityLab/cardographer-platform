import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import {getFileInfo, writeFile} from '$lib/builders/index.ts';
import type {PostFilesRequest} from '$lib/apitypes.ts';

const debug = true;
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get(request) {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const {deckid,revid,file} = request.params;
	if (debug) console.log(`get file ${deckid}/${revid}/${file}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	try {
		const files = await getFileInfo(deckid, revid, file);
		return {
			body: files
		}
	} catch (err) {
		console.log(`error getting file ${deckid}/${revid}/${file}: ${err.message}`);
		return { status: 500 }
	}
}
  
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function post(request) {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const req = await request.body as PostFilesRequest;
	const {deckid,revid} = request.params;
	const path = request.params.file;
	const db = await getDb();
	// permission check
	const deck = await db.collection('CardDeckSummaries').findOne({
		_id: deckid, owners: locals.email 
	}) as CardDeckSummary;
	if (!deck) {
		if (debug) console.log(`deck ${deckid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// revision
	const revision = await db.collection('CardDeckRevisions').findOne({
		deckId: deckid, revision: Number(revid)
	}) as CardDeckRevision;
	if (!revision) {
		if (debug) console.log(`revision ${revid} not found for deck ${deckid}`);
		return { status: 404 };
	}
	if (revision.isLocked) {
		if (debug) console.log(`revision ${revid} for ${deckid} locked`)
;
		return { status: 403 };
	}
	for (let file of req.files) {
		if (debug) console.log(`upload ${file.name}`);
		await writeFile(deckid, revid, path, file.name, file.content);
	}
	return {
		body: {}
	}
}
