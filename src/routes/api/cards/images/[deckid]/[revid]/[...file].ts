// DEPRECATED
// Should be obtained from (static)/uploads/...

import {getDb} from '$lib/db';
import type {CardDeckRevision} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';
import fs from 'fs';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	// No auth!
	const {deckId, revId, file} = request.params;
	const db = await getDb();
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revId} not found for deck ${deckId}`);
		return {status: 404};
	}
	if (debug) console.log(`get file ${file} for deck ${deckId} ${revId}`);
	if (file.indexOf('..') >= 0) {
		if (debug) console.log(`refuse back path ${file}`);
		return {status: 403};
	}
	const path = `uploads/${deckId}/${revId}/_output/${file}`;
	if (debug) console.log(`get file ${file} for deck ${deckId} ${revId} = ${path}`);
	const ix = file.lastIndexOf('.');
	if (ix < 0) {
		if (debug) console.log(`refuse file without extension: ${file}`);
		return {status: 403};
	}
	const ext = file.substring(ix + 1).toLowerCase();
	if ("png" == ext || "jpg" == ext) {
		return sendFile(request, path, "image/" + ext);
	}
	if (debug) console.log(`refuse file ${file}`);
	return {status: 403};
}

async function sendFile(request: Request, path: string, mimeType: string): Promise<EndpointOutput> {
	/*	return {
			headers: { 'content-type': mimeType },
			body: fs.createReadStream(path)
		};
	*/
	return new Promise<EndpointOutput>((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (err) {
				if (debug) console.log(`error reading ${path}: ${err}`);
				resolve({status: 404});
			}
			resolve({
				headers: {
					// sveltekit won't let me use an image mime type
					'content-type': 'application/octet-stream' //mimeType,
				},
				body: data
			});
		});
	});
}

