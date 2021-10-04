import {readBoard} from '$lib/csvutils';
import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Session} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';
import parse from 'csv-parse';

const debug = true;

export async function put(request: Request): Promise<EndpointOutput> {
	const req = await request.body as Uint8Array
	const csv = new TextDecoder().decode(req);
	console.log(csv)
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	const {sessionId} = request.params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`Session ${sessionId} not found for ${locals.email}`);
		return {status: 404};
	}
	// parse CSV file
	const cells: string[][] = await new Promise((resolve) => {
		parse(csv, {bom: true, columns: false, trim: true},
			(err, output) => {
				if (err) {
					if (debug) console.log(`csv error`, err);
					return {status: 400};
				}
				//console.log(`csv:`, output);
				resolve(output);
			});
	});
	session.board = readBoard(cells)
	session.lastModified = new Date().toISOString()
	const upd = await db.collection<Session>('Sessions').updateOne({
		_id: sessionId
	}, {
		$set: {
			// project changes
			lastModified: session.lastModified,
			board: session.board
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`Session ${sessionId} not updated`, upd);
		return {status: 404};
	}
	return {
		body: {
			session: session as any
		}
	}
}

