import {getFilePath} from '$lib/builders';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import AdmZip from "adm-zip";

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
		const path = await getFilePath(deckId, revisionId, file);
		const fileParts = file.split('/').reverse()
		console.log(fileParts)
		const lastPart = fileParts.find(part => part !== '')
		const filename = lastPart != null ? lastPart + ".zip" : "build.zip"
		const zip = new AdmZip();
		zip.addLocalFolder(path)
		throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
		// Suggestion (check for correctness before using):
		// return new Response(zip.toBuffer(), {
		// 	headers: {
		// 		'Content-Type': 'application/zip',
		// 		'Content-Disposition': 'attachment; filename=' + filename
		// 	}
		// });
		return {
			body: zip.toBuffer(),
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': 'attachment; filename=' + filename
			}
		}
	} catch (err) {
		console.log(`error getting file ${deckId}/${revisionId}/${file}: ${err.message}`);
		return new Response(undefined, { status: 500 })
	}
}