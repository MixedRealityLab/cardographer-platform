import {analysisNodeGraph} from '$lib/analysis'
import {getDb} from '$lib/db'
import {verifyAuthentication} from "$lib/security"
import type {Analysis} from '$lib/types'
import {RegionType} from "$lib/types"
import {error} from "@sveltejs/kit"
import type {Actions, PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals, parent}) {
	verifyAuthentication(locals)
	const analysis = await parent()
	return {
		analysis: analysis,
		graph: await analysisNodeGraph(analysis)
	}
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
		const regionTypes = data.getAll('region') as string[]
		const graph = await analysisNodeGraph(analysis)

		if (graph.regions.length != regionTypes.length) {

			throw error(400, 'Regions don\'t match')
		}

		let regions = []
		for (const index in graph.regions) {
			let region = graph.regions[index]
			const type = RegionType[regionTypes[index]]
			if (!type) {
				throw error(400)
			}
			regions.push({type: type, name: region.name})
		}

		const upd = await db.collection<Analysis>('Analyses').updateOne({
			_id: analysisId
		}, {
			$set: {
				regions: regions,
				lastModified: new Date().toISOString(),
			}
		});
		analysis.regions = regions
		if (!upd.matchedCount) {
			throw error(404)
		}
		return {success: true, graph: await analysisNodeGraph(analysis)}
	}
}