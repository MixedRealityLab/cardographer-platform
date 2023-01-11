import { json } from '@sveltejs/kit';
import {readBoard} from '$lib/csvutils';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Session} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import csv from "csv"

const {parse} = csv

const debug = true;

export const put: RequestHandler = async function ({locals, params, request}) {
	const csv = await request.text()
	console.log(csv)
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const {sessionId} = params;
	const db = await getDb();
	// permission check
	const session = await db.collection<Session>('Sessions').findOne({
		_id: sessionId, owners: locals.email
	})
	if (!session) {
		if (debug) console.log(`Session ${sessionId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
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
		return new Response(undefined, { status: 404 });
	}
	return json({
		session: session as any
	})
}