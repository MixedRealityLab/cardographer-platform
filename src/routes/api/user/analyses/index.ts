import {getDb,getNewId} from '$lib/db.ts';
import type {Analysis} from '$lib/types.ts';
import type {PostAnalysisResponse} from '$lib/apitypes.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function post(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	let an = request.body as Analysis;
	//if (debug) console.log(`add analysis`, analysis);
	const db = await getDb();
	// new analysis id
	const newid = getNewId();
	const now = new Date().toISOString();
	// sanitise
	const analysis: Analysis = {
		_id: newid,
		name: an.name || "Unnamed",
		description: an.description || "",
		credits: an.credits || "",
		created: now,
		lastModifid: now,
		owners: [ locals.email ],
		isPublic: false,
		snapshots: [],
	};
	// add
	let result = await db.collection('Analyses').insertOne(analysis);
	if (!result.insertedCount) {
		console.log(`Error adding new analysis ${newid}`);
		return { status: 500 };
	}
	console.log(`added analysis ${newid}`);

	return {
		body: { 
			analid: newid
		}
	}
}

