import {dev} from "$app/env";
import {getDb} from '$lib/db';
import type {CardDeckRevision} from '$lib/types';
import type {EndpointOutput, RequestEvent} from '@sveltejs/kit';
import fs from 'fs';
import mime from 'mime'

const debug = true;

export async function get({request, params}: RequestEvent): Promise<EndpointOutput> {
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

async function sendFile(request: Request, path: string): Promise<EndpointOutput> {
	/*	return {
			headers: { 'content-type': mimeType },
			body: fs.createReadStream(path)
		};
	*/
	return new Promise<EndpointOutput>((resolve) => {
		fs.readFile(path, (err, data) => {
			if (err) {
				if (debug) console.log(`error reading ${path}: ${err}`);
				resolve({status: 404});
			}
			resolve({
				headers: {
					// sveltekit won't let me use an image mime type
					'content-type': mime.getType(path)
				},
				body: data
			});
		});
	});
}

