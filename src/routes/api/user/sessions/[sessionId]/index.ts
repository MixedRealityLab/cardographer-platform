import {getDb} from '$lib/db';
import type {Session}   from '$lib/types';
import type {EndpointOutput, Request, RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes';

const debug = true;

export async function put(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const sess = request.body as unknown as Session;
	const {sessid} = request.params;
	if (sessid != sess._id) {
		if (debug) console.log(`session doesnt match url`, sess);
		return { status: 400 };
	}
	const db = await getDb();
	// permission check
	const oldSession = await db.collection<Session>('Sessions').findOne({
		_id: sessid, owners: locals.email 
	})
	if (!oldSession) {
		if (debug) console.log(`session ${sessid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// update session
	const now = new Date().toISOString();
	const upd = await db.collection<Session>('Sessions').updateOne({
                _id: sessid
        }, { $set: {
		// project changes
		name: sess.name,
		description: sess.description,
		credits: sess.credits,
		lastModified: now,
		isPublic: sess.isPublic,
		isArchived: sess.isArchived,
		isTemplate: sess.isTemplate,
		// others should get set in other ways
	}});
	if (!upd.matchedCount) {
		if (debug) console.log(`session ${sessid} not matched`, upd);
		return { status: 404 };
	}
	return {
		body: {}
	}
}
  
