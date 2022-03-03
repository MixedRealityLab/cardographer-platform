import {exportAnalysisAsCsv} from '$lib/analysis';
import {AnalysisExportTypes} from '$lib/analysistypes';
import {getDb} from '$lib/db';
import {isNotAuthenticated} from "$lib/security";
import type {Analysis} from '$lib/types';
import type {RequestHandler} from '@sveltejs/kit';

const debug = true;

export const get: RequestHandler = async function ({locals, params, url}) {
	if (isNotAuthenticated(locals)) {
		return {status: 401}
	}
	const {analysisId} = params;
	const db = await getDb();
	// permission check
	const analysis = await db.collection<Analysis>('Analyses').findOne({
		_id: analysisId, owners: locals.email
	})
	if (!analysis) {
		if (debug) console.log(`analysis ${analysisId} not found for ${locals.email}`);
		return {status: 404};
	}
	let exportType = AnalysisExportTypes.CARD_USE;
	if (url.searchParams.has('type')) {
		exportType = url.searchParams.get('type') as AnalysisExportTypes;
	}
	const splitByBoard = url.searchParams.has('splitByBoard');
	const includeDetail = url.searchParams.has('includeDetail');
	let boardNames: string[] = null;
	if (url.searchParams.has('boards')) {
		boardNames = url.searchParams.get('boards').split(',').map((n) => n.trim());
	}
	const csv = await exportAnalysisAsCsv(analysis, exportType, splitByBoard, includeDetail, boardNames);
	let typeName = "Card Use"
	if (exportType == AnalysisExportTypes.CARD_ADJACENCY) {
		typeName = "Card Adjacency"
	}
	const name = analysis.name + " " + typeName + ".csv"
	return {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': 'attachment; filename="' + name + '"'
		},
		body: csv
	}
}

