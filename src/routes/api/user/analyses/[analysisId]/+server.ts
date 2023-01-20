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
		throw error(404)
	}
	return json({
		body: analysis as any
	})
}