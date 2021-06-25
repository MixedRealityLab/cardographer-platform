import {getDb} from '$lib/db.ts';
import type {Analysis} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';
import type {ServerLocals} from '$lib/systemtypes.ts';
import {exportAnalysisAsCsv} from '$lib/analysis.ts';
import {AnalysisExportTypes} from '$lib/analysistypes.ts';

const debug = true;

export async function get(request): RequestHandler {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return { status: 403 }
	}
	const {analid} = request.params;
	const db = await getDb();
	// permission check
	const analysis = await db.collection('Analyses').findOne({
		_id: analid, owners: locals.email 
	}) as Analysis;
	if (!analysis) {
		if (debug) console.log(`analysis ${analid} not found for ${locals.email}`);
		return { status: 404 };
	}
	let exportType = AnalysisExportTypes.CARD_USE;
	if (request.query.has('type')) {
		exportType = request.query.get('type') as AnalysisExportTypes;
	}
	const splitByBoard = request.query.has('splitByBoard');
	const includeDetail = request.query.has('includeDetail');
	const csv = await exportAnalysisAsCsv( analysis, exportType, splitByBoard, includeDetail );
	return {
		headers: { 'content-type': 'text/csv; charset=utf-8' },
		body: csv
	}
}

