import {exportAnalysisAsCsv} from '$lib/analysis';
import {AnalysisExportTypes} from '$lib/analysistypes';
import {getDb} from '$lib/db';
import type {ServerLocals} from '$lib/systemtypes';
import type {Analysis} from '$lib/types';
import type {EndpointOutput, Request} from '@sveltejs/kit';

const debug = true;

export async function get(request: Request): Promise<EndpointOutput> {
	const locals = request.locals as ServerLocals;
	if (!locals.authenticated) {
		if (debug) console.log(`locals`, locals);
		return {status: 403}
	}
	const {analid} = request.params;
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analid, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analid} not found for ${locals.email}`);
		return {status: 404};
	}
	let exportType = AnalysisExportTypes.CARD_USE;
	if (request.query.has('type')) {
		exportType = request.query.get('type') as AnalysisExportTypes;
	}
	const splitByBoard = request.query.has('splitByBoard');
	const includeDetail = request.query.has('includeDetail');
	let boardNames: string[] = null;
	if (request.query.has('boards')) {
		boardNames = request.query.get('boards').split(',').map((n) => n.trim());
	}
	const csv = await exportAnalysisAsCsv(analysis, exportType, splitByBoard, includeDetail, boardNames);
	return {
		headers: {'content-type': 'text/csv; charset=utf-8'},
		body: csv
	}
}

