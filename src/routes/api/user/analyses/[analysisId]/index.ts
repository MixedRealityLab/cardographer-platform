import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Analysis} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	const {analysisId} = request.params;
	if (debug) console.log(`get analysis ${analysisId}`);
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return {status: 404};
	}
	// project?
	return {
		body: analysis as any
	}
}

export async function put(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 401}
	}
	const analysis = request.body as unknown as Analysis;
	const {analysisId} = request.params;
	if (analysisId != analysis._id) {
		if (debug) console.log(`analysis doesnt match url`, analysisId);
		return {status: 400};
	}
	const db = await getDb();
	// permission check
	const oldAnalysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!oldAnalysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return {status: 404};
	}
	// update analysis
	const now = new Date().toISOString();
	const upd = await db.collection<Analysis>('Analyses').updateOne({
		_id: analysisId
	}, {
		$set: {
			// project changes
			name: analysis.name,
			description: analysis.description,
			credits: analysis.credits,
			lastModified: now,
			isPublic: analysis.isPublic,
			snapshotIds: analysis.snapshotIds, //?
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`analysis ${analysisId} not matched`, upd);
		return {status: 404};
	}
	return {
		body: {}
	}
}
  
