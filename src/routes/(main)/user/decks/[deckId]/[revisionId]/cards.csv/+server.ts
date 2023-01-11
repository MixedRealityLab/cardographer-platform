import {exportCardsAsCsv} from '$lib/csvutils';
import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {CardDeckRevision, CardDeckSummary} from '$lib/types';
import {error} from "@sveltejs/kit";
import type {RequestHandler} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals, params, url}) {
	verifyAuthentication(locals)
	const {deckId, revisionId} = params
	const db = await getDb()
	// permission check
	const deck = await db.collection<CardDeckSummary>('CardDeckSummaries').findOne({
		_id: deckId, owners: locals.email
	})
	if (!deck) {
		throw error(404)
	}
	// project to summary
	const revision = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
		deckId: deckId, revision: Number(revisionId)
	})
	if (!revision) {
		throw error(404)
	}
	const allColumns = url.searchParams.has('allColumns');
	const withRowTypes = url.searchParams.has('withRowTypes');
	const csv = await exportCardsAsCsv(revision, allColumns, withRowTypes, null);
	return new Response(csv, {headers: {'content-type': 'text/csv; charset=utf-8'}})
}

