import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Analysis} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';
import {error, json} from '@sveltejs/kit';

export const GET: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals, false)
	const {analysisId} = params;
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		throw error(404, `Analysis ${analysisId} not found`)
	}
	return json({
		body: analysis as any
	})
}

// noinspection JSUnusedGlobalSymbols
export const PUT: RequestHandler = async function ({request, locals, params}) {
	verifyAuthentication(locals, false)
	const analysis = await request.json() as Analysis;
	const {analysisId} = params;
	if (analysisId != analysis._id) {
		throw error(400)
	}
	const db = await getDb();
	// permission check
	const oldAnalysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!oldAnalysis) {
		throw error(404, `Analysis ${analysisId} not found`)
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
		throw error(404, `Analysis ${analysisId} not found`)
	}
	return json({success: true})
}
