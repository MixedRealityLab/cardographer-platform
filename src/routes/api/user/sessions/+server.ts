import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {json} from '@sveltejs/kit';

const debug = false;

export const get: RequestHandler = async function ({locals}) {
	verifyAuthentication(locals)
	if (debug) console.log(`get sessions`);
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions').find({
		owners: locals.email
	}).toArray()
	if (debug) console.log(`sessions for ${locals.email}`, sessions);
	return json({
		values: sessions as any
	})
}

