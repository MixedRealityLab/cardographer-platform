import { json as json$1 } from '@sveltejs/kit';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Analysis} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';

const debug = true;

export const get: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const {analysisId} = params;
	if (debug) console.log(`get analysis ${analysisId}`);
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	// project?
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
	// Suggestion (check for correctness before using):
	// return new Response(analysis as any);
	return {
		body: analysis as any
	}
}

export const put: RequestHandler = async function ({request, locals, params}) {
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return new Response(undefined, { status: 401 })
	}
	const analysis = await request.json() as Analysis;
	const {analysisId} = params;
	if (analysisId != analysis._id) {
		if (debug) console.log(`analysis doesnt match url`, analysisId);
		return new Response(undefined, { status: 400 });
	}
	const db = await getDb();
	// permission check
	const oldAnalysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!oldAnalysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	// update analysis
	const now = new Date().toISOString();
	if (!analysis.owners) {
		analysis.owners = [locals.email]
	}
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
			owners: analysis.owners
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`analysis ${analysisId} not matched`, upd);
		return new Response(undefined, { status: 404 });
	}
	return json$1({})
}

export const del: RequestHandler = async function ({locals, params}) {
	if (isNotAuthenticated(locals)) {
		return new Response(undefined, { status: 401 })
	}
	const {analysisId} = params;
	if (debug) console.log(`get analysis ${analysisId}`);
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').deleteOne({
		_id: analysisId, owners: locals.email
	})
	if (analysis.deletedCount == 0) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return new Response(undefined, { status: 404 });
	}
	throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
	// Suggestion (check for correctness before using):
	// return new Response(analysis as any);
	return {
		body: analysis as any
	}
}
