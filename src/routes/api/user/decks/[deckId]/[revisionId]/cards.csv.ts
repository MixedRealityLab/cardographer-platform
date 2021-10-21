import {exportCardsAsCsv} from '$lib/csvutils';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get({locals, params, query}: Request): Promise<EndpointOutput> {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {deckId, revisionId} = params;
	if (debug) console.log(`get revision ${revisionId} for ${deckId}`);
	const db = await getDb();
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		if (debug) console.log(`deck ${deckId} not found for ${locals.email}`);
		return {status: 404};
	}
	// project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		if (debug) console.log(`revision ${revisionId} not found for deck ${deckId}`);
		return {status: 404};
	}
	const allColumns = query.has('allColumns');
	const withRowTypes = query.has('withRowTypes');
	const csv = await exportCardsAsCsv(revision, allColumns, withRowTypes, null);
	return {
		headers: {'content-type': 'text/csv; charset=utf-8'},
		body: csv
	}
}
  
