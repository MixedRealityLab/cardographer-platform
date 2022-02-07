import {analysisNodeGraph} from '$lib/analysis';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Analysis, AnalysisRegion} from '$lib/types'
import type {EndpointOutput, RequestEvent} from '@sveltejs/kit'

const debug = true;

export async function get({locals, params}: RequestEvent): Promise<EndpointOutput> {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {analysisId} = params
	const db = await getDb()
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`)
		return {status: 404}
	}
	return {
		body: await analysisNodeGraph(analysis)
	}
}

export async function put({locals, request, params}: RequestEvent): Promise<EndpointOutput> {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const regions = await request.json() as unknown as AnalysisRegion[]
	for (const region of regions) {
		// if (region.type === RegionType.SubRegions) {
		// }
		delete region['regions']
	}
	const {analysisId} = params
	const db = await getDb()
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return {status: 404};
	}
	// update analysis
	const now = new Date().toISOString();
	analysis.regions = regions
	analysis.lastModified = now
	const upd = await db.collection<Analysis>('Analyses').updateOne({
		_id: analysisId
	}, {
		$set: {
			regions: regions,
			lastModified: now,
		}
	});
	if (!upd.matchedCount) {
		if (debug) console.log(`analysis ${analysisId} not matched`, upd);
		return {status: 404};
	}
	return {
		body: await analysisNodeGraph(analysis)
	}
}