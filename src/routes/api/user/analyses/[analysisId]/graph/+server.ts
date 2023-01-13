import {analysisNodeGraph} from '$lib/analysis';
import {getDb} from '$lib/db';
import {verifyAuthentication} from "$lib/security";
import type {Analysis} from '$lib/types'
import {RegionType} from "$lib/types";
import type {RequestHandler} from '@sveltejs/kit'
import {error, json} from "@sveltejs/kit";
import type {Actions} from "./$types";

export const GET: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {analysisId} = params
	const db = await getDb()
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		throw error(404)
	}
	return json(await analysisNodeGraph(analysis))
}

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {analysisId} = params
		const db = await getDb()
		// permission check
		const analysis = await db.collection<Analysis>('Analyses').findOne({
			_id: analysisId, owners: locals.email
		})
		if (!analysis) {
			throw error(404)
		}
		// update analysis
		const data = await request.formData();
		const regionTypes = data.getAll('regions') as string[]
		console.log(regionTypes)
		const regions = analysis.regions

		if (regions.length != regionTypes.length) {
			throw error(400)
		}

		for (const index in regions) {
			let region = regions[index]
			const type = RegionType[regionTypes[index]]
			if (!type) {
				throw error(400)
			}
			region.type = type
			console.log(region)
		}
		console.log(regions)

		const upd = await db.collection<Analysis>('Analyses').updateOne({
			_id: analysisId
		}, {
			$set: {
				regions: regions,
				lastModified: new Date().toISOString(),
			}
		});
		if (!upd.matchedCount) {
			throw error(404)
		}
		return {success: true}
	}
}