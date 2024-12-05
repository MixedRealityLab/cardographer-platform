import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {error, json} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals, params}) {
	await verifyAuthentication(locals, false)
	const {sessionId} = params;
	const db = await getDb();
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		throw error(404, `Session ${sessionId} Not Found`)
	}
	return json(session)
}