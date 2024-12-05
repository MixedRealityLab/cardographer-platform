import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {json} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals}) {
	await verifyAuthentication(locals, false)
	const db = await getDb();
	const sessions = await db.collection<Session>('Sessions').find({
		owners: locals.email
	}).toArray()
	return json({
		values: sessions as any
	})
}

