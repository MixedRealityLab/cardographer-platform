import {getDb} from '$lib/db.ts';
import type {CardDeckSummary,CardDeckRevision} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import fs from 'fs';

const debug = true;

export async function get(request): RequestHandler {
	// No auth!
	const {deckid,revid,file} = request.params;
	const db = await getDb();
	const revision = await db.collection('CardDeckRevisions').findOne({
                deckId: deckid, revision: Number(revid)
        }) as CardDeckRevision;
	if (!revision) {
		if (debug) console.log(`revision ${revid} not found for deck ${deckid}`);
		return { status: 404 };
	}
	if (debug) console.log(`get file ${file} for deck ${deckid} ${revid}`);
	if (file.indexOf('..') >= 0) {
		if (debug) console.log(`refuse back path ${file}`);
		return { status: 403 };
	}
	const path = `uploads/${deckid}/${revid}/_output/${file}`;
	if (debug) console.log(`get file ${file} for deck ${deckid} ${revid} = ${path}`);
	const ix = file.lastIndexOf('.');
	if (ix<0) {
		if (debug) console.log(`refuse file without extension: ${file}`);
		return {status: 403};
	}
	const ext = file.substring(ix+1).toLowerCase();
	if ("png" == ext || "jpg" == ext) {
		return sendFile(request, path, "image/"+ext);
	}
	if (debug) console.log(`refuse file ${file}`);
	return {status:403};
}
async function sendFile(request, path:string, mimeType: string):RequestHandler {
/*	return {
		headers: { 'content-type': mimeType },
		body: fs.createReadStream(path)
	};
*/
	return new Promise<RequestHandler>((resolve, reject) => {
		fs.readFile(path, (err,data) => {
			if (err) {
				if (debug) console.log(`error reading ${path}: ${err}`);
				resolve({status:404});
			}
			resolve({
				headers: {
					// sveltekit won't let me use an image mime type
					'content-type':'application/octet-stream' //mimeType,
				},
				body: data
			});
		});
	});
}

