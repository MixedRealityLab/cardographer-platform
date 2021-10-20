import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Session} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	const {sessionId} = request.params;
	if (debug) console.log(`get session ${sessionId}`);
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	console.log(session)
	if (!session) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		return {status: 404};
	}
	// project?
	return {
		body: session as any
	}
}

export async function put(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	const sess = request.body as unknown as Session;
	const {sessionId} = request.params;
	if (sessionId != sess._id) {
		if (debug) console.log(`session doesnt match url`, sess);
		return {status: 400};
	}
	const db = await getDb();
	// permission check
	const oldSession = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!oldSession) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		return {status: 404};
	}
	// update session
	const now = new Date().toISOString();
	if(!sess.owners) {
		sess.owners = [locals.email]
	}
	const upd = await db.collection<Session>('Sessions').updateOne({
		_id: sessionId
	}, {
		$set: {
			// project changes
			name: sess.name,
			description: sess.description,
			credits: sess.credits,
			lastModified: now,
			isPublic: sess.isPublic,
			isArchived: sess.isArchived,
			isTemplate: sess.isTemplate,
			owners: sess.owners
			// others should get set in other ways
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`session ${sessionId} not matched`, upd);
		return {status: 404};
	}
	return {
		body: {}
	}
}
  
