import { Analysis, SessionSnapshot } from '$lib/types.ts';
import stringify from 'csv-stringify';
import { getDb } from '$lib/db.ts';

const debug = true;

export async function exportAnalysisAsCsv( analysis: Analysis) : string {
	const db = await getDb();
	// get real snapshots
	let snapshots:SessionSnapshot[] = [];
	for (let s of analysis.snapshots) {
		const snapshot = await db.collection('SessionSnapshots').findOne({
			_id: s._id
		});
		if (!snapshot) {
			if (debug) console.log(`cannot find real snapshot ${s._id}`);
		} else {
			snapshots.push(snapshot);
		}
	}
	console.log(`extract something from ${snapshots.length} snapshots...`);
	// TODO
	return 'TODO';
}

