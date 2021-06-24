import {getDb} from '$lib/db.ts';
import type {Analysis} 
  from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';

const debug = true;

export async function put(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const analysis = request.body as Analysis;
	const {analid} = request.params;
	if (analid != analysis._id) {
		if (debug) console.log(`session doesnt match url`, sess);
		return { status: 400 };
	}
	const db = await getDb();
	// permission check
	const oldAnalysis = await db.collection('Analyses').findOne({
		_id: analid, owners: locals.email 
	}) as Analysis;
	if (!oldAnalysis) {
		if (debug) console.log(`analysis ${analid} not found for ${locals.email}`);
		return { status: 404 };
	}
	// update analysis
	const now = new Date().toISOString();
	const upd = await db.collection('Analyses').updateOne({
                _id: analid
        }, { $set: {
		// project changes
		name: analysis.name,
		description: analysis.description,
		credits: analysis.credits,
		lastModified: now,
		isPublic: analysis.isPublic,
		snapshots: analysis.snapshots, //?
	}});
	if (!upd.matchedCount) {
		if (debug) console.log(`analysis ${analid} not matched`, upd);
		return { status: 404 };
	}
	return {
		body: {}
	}
}
  
