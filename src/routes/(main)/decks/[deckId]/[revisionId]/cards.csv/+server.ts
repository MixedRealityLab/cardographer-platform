import {exportCardsAsCsv} from '$lib/csvutils';
import {getDb} from '$lib/db';
import {getRevision} from "$lib/decks";
import {verifyAuthentication} from "$lib/security";
import type {RequestHandler} from '@sveltejs/kit';
import { verifyLocalUserIsDeckBuilder } from '$lib/userutils';

export const GET: RequestHandler = async function ({locals, params, url}) {
	verifyAuthentication(locals)
	verifyLocalUserIsDeckBuilder(locals)
	const {deckId, revisionId} = params
	const db = await getDb()
	const revision = await getRevision(db, deckId, Number(revisionId), locals.email)
	const allColumns = url.searchParams.has('allColumns');
	const withRowTypes = url.searchParams.has('withRowTypes');
	const csv = await exportCardsAsCsv(revision, allColumns, withRowTypes, null);
	return new Response(csv, {headers: {'content-type': 'text/csv; charset=utf-8'}})
}

