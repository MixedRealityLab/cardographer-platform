import type { Analysis, SessionSnapshot } from '$lib/types.ts';
import type { SnapshotInfo,BoardInfo,CardInfo } from '$lib/analysistypes.ts';
import { arrayToCsv } from '$lib/csvutils.ts';
import { getDb } from '$lib/db.ts';
import { Client } from '$lib/clients/types.ts';
import { getClient } from '$lib/clients/index.ts';

const debug = true;

interface DesignInfo {
	id: string;
	snapshot: SessionSnaphot;
	boards: BoardInfo[];
}
interface CardUse {
	id: string;
	use: CardInfo[];
}
 
export async function exportAnalysisAsCsv( analysis: Analysis, splitByBoard:boolean ) : string {
	let rawdesigns:DesignInfo[] = await readDesigns( analysis );
	// split by board?
	let designs = rawdesigns;
	if (splitByBoard) {
		designs = [];
		for (let design of rawdesigns) {
			for (let bi in design.boards) {
				let board = design.boards[bi];
				let id = board.id ? `${design.id}:${board.id}` : design.id;
				designs.push({
					id: id,
					snapshot: design.snapshot,
					boards: [board],
				});
			}
		}
	}
	if (debug) console.log(`found ${designs.length} designs`);
	// find all cards
	let cardUses:CardUse = [];
	for (let di in designs) {
		const design = designs[di];
		for (let board of design.boards) {
			for (let cardinfo of board.cards) {
				let cardUse:CardUse = cardUses.find((cu)=> cu.id==cardinfo.id);
				if (!cardUse) {
					if (debug) console.log(`add cardUse ${cardinfo.id} (design ${design.id})`);
					cardUse = {
						id: cardinfo.id,
						use: [],
					}
					cardUses.push(cardUse);
				}
				if (cardUse.use[di]) {
					cardUse.use[di].push(cardinfo);
				} else {
					cardUse.use[di] = [cardinfo];
				}
				if (debug) console.log(`${cardUse.use[di].length} uses of card ${cardUse.id} in design ${design.id}`);
			}
		}
	}
	let rows:string[][] = [];
	// titles
	let columns:string[] = [];
	columns.push('Id');
	for (let di in designs) {
                columns.push(designs[di].id);
	}
	rows.push(columns);
	for (let cardUse of cardUses) {
		let row:string[]= [];
		row.push(cardUse.id);
		for (let di in designs) {
			let use = cardUse.use[di];
			if (use) {
				row.push(`${use.length}`);
			} else {
				row.push('');
			}
		}
		rows.push(row);
	}
	const csv = arrayToCsv(rows);
	return csv;
}

async function readDesigns( analysis: Analysis ) : DesignInfo[] {
	const db = await getDb();
	// get real snapshots
	let designs:DesignInfo[] = [];
	for (let s of analysis.snapshots) {
		const snapshot = await db.collection('SessionSnapshots').findOne({
			_id: s._id
		});
		if (!snapshot) {
			if (debug) console.log(`cannot find real snapshot ${s._id}`);
			continue;
		}
		const client = getClient( snapshot.sessionType );
		if (!client) {
			console.log(`cannot find client for sessionType ${snapshot.sessionType}`);
			continue;
		}
		const info = client.getSnapshotInfo(snapshot);
		designs.push({ 
			id: snapshot._id, //??
			snapshot, 
			boards: info.boards 
		});
	}
	//console.log(`extract something from ${snapshots.length} snapshots...`);
	return designs;
}

