import {analysisNodeGraph} from "$lib/analysis";
import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Analysis, AnalysisRegion} from "$lib/types";
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
		const regions = await request.json() as AnalysisRegion[]
		for (const region of regions) {
			// if (region.type === RegionType.SubRegions) {
			// }
			delete region['regions']
		}
		const {analysisId} = params
		const db = await getDb()
		const now = new Date().toISOString();
		const upd = await db.collection<Analysis>('Analyses').updateOne({
			_id: analysisId
		}, {
			$set: {
				regions: regions,
				lastModified: now,
			}
		});
		if (!upd.matchedCount) {
			throw error(404)
		}
		return {success: true}
	}
}