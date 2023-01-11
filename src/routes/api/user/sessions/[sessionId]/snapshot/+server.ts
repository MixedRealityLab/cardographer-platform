import {getClient, guessSessionType} from "$lib/clients"
import {getDb, getNewId} from "$lib/db"
import {isNotAuthenticated, verifyAuthentication} from "$lib/security"
import type {Session, SessionSnapshot} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {sessionId} = params;
	const db = await getDb();
	const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots').findOne({sessionId: sessionId});
	if (!snapshot) {
		return new Response(undefined, {status: 404})
	}

	return json(snapshot)
}

export const PUT: RequestHandler = async function ({locals, params, request}) {
	verifyAuthentication(locals)
	const input = await request.json()
	if (!input.url || !input.snapshot) {
		throw error(400)
	}
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	let session: Session
	console.log(sessionId)

	let sessionType = guessSessionType(input.snapshot);
	if (!sessionType) {
		console.log(`no sessionType guess for import`);
		return error(400)
	}

	if (sessionId === 'new') {
		session = {
			_id: getNewId(),
			created: new Date().toISOString(),
			credits: input.snapshot.owner.name,
			decks: [],
			description: 'Miro Board ' + input.url,
			isArchived: false,
			isPublic: false,
			isTemplate: false,
			lastModified: "",
			name: input.snapshot.name || input.snapshot.title || "New Session",
			owners: [locals.email],
			sessionType: ""
		}
		await db.collection<Session>('Sessions').insertOne(session)
	} else {
		session = await db.collection<Session>('Sessions').findOne({
			_id: sessionId, owners: locals.email
		})
	}
	console.log(session)
	if (!session) {
		return new Response(undefined, {status: 404});
	}

	// Check snapshot doesn't already exist?
	const exists = await db.collection<SessionSnapshot>('SessionSnapshots').countDocuments({
		sessionId: session._id,
		data: input.snapshot
	})
	if (exists > 0) {
		return new Response(undefined, {status: 409})
	}

	sessionType = guessSessionType(input.snapshot);
	if (!sessionType) {
		console.log(`no sessionType guess for import ${session._id}`);
		return {status: 400}
	}

	console.log(`SessionType: ${sessionType}`);
	const client = getClient(sessionType);
	const snapshot = client.makeSessionSnapshot(input.snapshot);
	const snapshotId = getNewId();
	snapshot.sessionId = sessionId;
	snapshot._id = snapshotId;
	snapshot.owners = session.owners;

	// TODO Some Versioning?

	const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
	if (!r2.insertedId) {
		console.log(`Error adding new imported snapshot`);
		return new Response(undefined, {status: 500})
	}

	// session already imported?
	session.sessionType = sessionType
	session.url = input.url
	session.lastModified = new Date().toISOString()
	const upd = await db.collection<Session>('Sessions').updateOne({
		_id: session._id
	}, {
		$set: {
			// project changes
			lastModified: session.lastModified,
			sessionType: session.sessionType,
			url: session.url,
		}
	});
	if (!upd.matchedCount) {
		return new Response(undefined, {status: 404});
	}
	return json(session)
}