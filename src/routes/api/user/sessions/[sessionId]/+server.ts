import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Session, SessionSnapshot} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {error, json, json as json$1} from '@sveltejs/kit';
import {promises as fs} from 'fs';

const debug = true;

export const GET: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
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
		throw error(404);
	}
	// project?
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
	// Suggestion (check for correctness before using):
	// return new Response(session as any);
	return json(session)
}

export const put: RequestHandler = async function ({locals, request, params}) {
	verifyAuthentication(locals)
	const sess = await request.json() as Session
	const {sessionId} = params
	if (sessionId != sess._id) {
		if (debug) console.log(`session doesnt match url`, sess);
		throw error(400);
	}
	const db = await getDb();
	// permission check
	const oldSession = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!oldSession) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		throw error(404);
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
		throw error(404);
	}
	return json$1({})
}

export const del: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {sessionId} = params
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').deleteOne({
		_id: sessionId, owners: locals.email
	})
	if (session.deletedCount == 0) {
		if (debug) console.log(`session ${sessionId} not found for ${locals.email}`);
		throw error(404);
	}
	await db.collection<SessionSnapshot>('SessionSnapshots').deleteMany({sessionId: sessionId})

	await fs.rm('/app/data/sessions/' + sessionId, {recursive: true, force: true})

	return json({})
}