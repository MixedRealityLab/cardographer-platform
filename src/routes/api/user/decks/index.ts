import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {CardDeckSummary} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';

const debug = true;

export const get: RequestHandler = async function ({locals}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	if (debug) console.log(`get decks`);
	const db = await getDb();
	const decks = await db.collection<CardDeckSummary>('CardDeckSummaries').find({
		owners: locals.email
	}).toArray()
	if (debug) console.log(`decks for ${locals.email}`, decks);
	return {
		body: {
			decks: decks as any[]
		}
	}
}