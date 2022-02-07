import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Session} from '$lib/types';
import type {EndpointOutput, RequestEvent} from '@sveltejs/kit';

const debug = false;

export async function get({locals}: RequestEvent): Promise<EndpointOutput> {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	if (debug) console.log(`get sessions`);
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions').find({
		owners: locals.email
	}).toArray()
	if (debug) console.log(`sessions for ${locals.email}`, sessions);
	return {
		body: {
			values: sessions as any
		}
	}
}

