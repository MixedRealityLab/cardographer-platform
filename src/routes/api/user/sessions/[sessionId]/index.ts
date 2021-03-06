import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Session, SessionSnapshot} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import { promises as fs } from 'fs';

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {sessionId} = params;
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

export const PUT: RequestHandler = async function ({locals, request, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const sess = await request.json() as Session
	const {sessionId} = params
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
	if (!sess.owners) {
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

export const DELETE: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {sessionId} = params
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').deleteOne({
		_id: sessionId, owners: locals.email
	})
	if (session.deletedCount == 0) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		return {status: 404};
	}
	await db.collection<SessionSnapshot>('SessionSnapshots').deleteMany({sessionId: sessionId})

	await fs.rm('/app/data/sessions/' + sessionId, {recursive: true, force: true})

	return {
		body: {}
	}
}