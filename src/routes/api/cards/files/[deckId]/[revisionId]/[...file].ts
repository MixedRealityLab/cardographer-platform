import {dev} from "$app/env";
import {getDb} from '$lib/db';
import type {CardDeckRevision} from '$lib/types';
import type {RequestHandler, RequestHandlerOutput} from '@sveltejs/kit';
import {readFile} from 'fs';
import {getType} from 'mime';

const debug = true;

export const GET: RequestHandler = async function ({request, params}) {
	if (!dev) {
		return {status: 404}
	}
	// No auth!
	const {deckId, revisionId, file} = params;
	const db = await getDb();
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return {status: 404};
	}
	if (debug) console.log(`get file ${file} for deck ${deckId} ${revisionId}`);
	if (file.indexOf('..') >= 0) {
		if (debug) console.log(`refuse back path ${file}`);
		return {status: 401};
	}
	const path = `/app/uploads/${deckId}/${revisionId}/${file}`;
	if (debug) console.log(`get file ${file} for deck ${deckId} ${revisionId} = ${path}`);
	return sendFile(request, path);
	//if (debug) console.log(`refuse file ${file}`);
	//return {status: 401};
}

async function sendFile(request: Request, path: string): Promise<RequestHandlerOutput> {
	/*	return {
			headers: { 'content-type': mimeType },
			body: fs.createReadStream(path)
		};
	*/
	return new Promise<RequestHandlerOutput>((resolve) => {
		readFile(path, (err, data) => {
			if (err) {
				if (debug) console.log(`error reading ${path}: ${err}`);
				resolve({status: 404});
			}
			resolve({
				headers: {
					// sveltekit won't let me use an image mime type
					'content-type': getType(path)
				},
				body: data
			});
		});
	});
}

