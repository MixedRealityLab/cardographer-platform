import {getClient, guessSessionType} from "$lib/clients"
import {getDb, getNewId} from "$lib/db"
import {isNotAuthenticated} from "$lib/security"
import type {Session, SessionSnapshot} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"

export const get: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {sessionId} = params;
	const db = await getDb();
	const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots').findOne({sessionId: sessionId});
	if (!snapshot) {
		return {status: 404}
	}

	return {
		body: {
			session: snapshot as any
		}
	}
}

export const put: RequestHandler = async function ({locals, params, request}) {
	const input = await request.json()
	if (!input.url || !input.snapshot) {
		return {status: 400}
	}
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	let session: Session
	console.log(sessionId)
	if (sessionId === 'new') {
		session = {
			_id: getNewId(),
			created: new Date().toISOString(),
			credits: input.snapshot.owner.name,
			currentStage: 0,
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
		return {status: 404};
	}
	const sessionType = guessSessionType(input.snapshot);
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

	await db.collection<SessionSnapshot>('SessionSnapshots').deleteMany({sessionId: sessionId})

	const r2 = await db.collection<SessionSnapshot>('SessionSnapshots').insertOne(snapshot);
	if (!r2.insertedId) {
		console.log(`Error adding new imported snapshot`);
		return {status: 500}
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
			url: session.url
		}
	});
	if (!upd.matchedCount) {
		return {status: 404};
	}

	return {
		body: session as any
	}
}

