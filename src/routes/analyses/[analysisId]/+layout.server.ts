import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security";
import type {Analysis} from "$lib/types"
import {error} from "@sveltejs/kit";
import type {LayoutServerLoad} from "./$types"

export const load: LayoutServerLoad = async function ({locals, params, url}) {
	verifyAuthentication(locals)
	const {analysisId} = params
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})

	if (!analysis) {
		throw error(404);
	}
	return analysis
}
