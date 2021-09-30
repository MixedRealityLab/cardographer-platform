import {base as sbase} from '$app/paths';
import {getDb} from '$lib/db';
import {EXTERNAL_SERVER_URL} from '$lib/env';
import type {ServerLocals} from '$lib/systemtypes';
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {EndpointOutput} from '@sveltejs/kit';

const debug = true;

export async function get(request): Promise<EndpointOutput> {
	const {deckId, revId} = request.params;
	const db = await getDb();
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revId} not found for deck ${deckId}`);
		return {status: 404};
	}
	if (!revision.isPublic) {
		// permission check
		const locals = request.locals as ServerLocals;
		if (!locals.authenticated) {
			return {status: 401}
		}
		const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
			_id: deckId, owners: locals.email
		}) as CardDeckSummary;
		if (!deck) {
			if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
			return {status: 404};
		}
	}
	if (revision.output?.atlases && revision.output.atlases.length > 0) {
		let atlases = revision.output.atlases;
		if (debug) console.log(`fix external URLs with ${EXTERNAL_SERVER_URL} and ${sbase}`);
		// fix URLs
		for (let atlas of atlases) {
			for (let i = 0; i < atlas.atlasURLs.length; i++) {
				if (!atlas.atlasURLs[i].startsWith('http')) {
					atlas.atlasURLs[i] = `${EXTERNAL_SERVER_URL}${sbase}${atlas.atlasURLs[i]}`;
				}
			}
		}
		return {
			body: atlases as any
		}
	} else {
		if (debug) console.log(`no output atlases for ${deckId} ${revId}`);
		return {body: []}
	}
}
  
