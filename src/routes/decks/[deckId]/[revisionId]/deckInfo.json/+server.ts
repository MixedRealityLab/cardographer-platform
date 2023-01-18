import {base as sbase} from '$app/paths';
import {getDb} from '$lib/db';
import {getRevision} from "$lib/decks";
import {EXTERNAL_SERVER_URL} from '$lib/env';
import type {RequestHandler} from '@sveltejs/kit';
import {error, json} from "@sveltejs/kit";

const debug = true;

export const GET: RequestHandler = async function ({params, locals}) {
	const {deckId, revisionId} = params;
	const db = await getDb();
	const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
	if (revision.output?.atlases && revision.output.atlases.length > 0) {
		const atlases = revision.output.atlases;
		if (debug) console.log(`fix external URLs with ${EXTERNAL_SERVER_URL} and ${sbase}`);
		// fix URLs
		for (const atlas of atlases) {
			for (let i = 0; i < atlas.atlasURLs.length; i++) {
				if (!atlas.atlasURLs[i].startsWith('http')) {
					atlas.atlasURLs[i] = `${EXTERNAL_SERVER_URL}${sbase}${atlas.atlasURLs[i]}`;
				}
			}
		}
		return json(atlases)
	} else {
		throw error(404)
	}
}
  
