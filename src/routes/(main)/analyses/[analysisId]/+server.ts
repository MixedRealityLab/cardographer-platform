import {getDb} from "$lib/db";
import {verifyAuthentication} from "$lib/security"
import type {Analysis} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {error, json} from "@sveltejs/kit";

export const DELETE: RequestHandler = async function ({locals, params}) {
	verifyAuthentication(locals)
	const {analysisId} = params;
	const db = await getDb();
	const analysis = await db.collection<Analysis>('Analyses').deleteOne({
		_id: analysisId, owners: locals.email
	})
	if (analysis.deletedCount == 0) {
		throw error(404);
	}

	return json({})
}