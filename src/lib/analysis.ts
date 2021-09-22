import type {BoardInfo, CardInfo} from '$lib/analysistypes';
import {AnalysisExportTypes} from '$lib/analysistypes';
import {getClient} from '$lib/clients';
import {arrayToCsv} from '$lib/csvutils';
import {getDb} from '$lib/db';
import type {Analysis, SessionSnapshot} from '$lib/types';

const debug = true;

interface DesignInfo {
	id: string;
	snapshot: SessionSnapshot;
	boards: BoardInfo[];
}

interface CardUse {
	id: string;
	use: CardInfo[];
}

export async function exportAnalysisAsCsv(analysis: Analysis, exportType: AnalysisExportTypes, splitByBoard: boolean, includeDetail: boolean, boardNames: string[]): Promise<string> {
	let rawDesigns: DesignInfo[] = await readDesigns(analysis);
	// canonicalize card ids and filter boards
	for (let design of rawDesigns) {
		// filter boards
		design.boards = design.boards.filter((b) => !boardNames || boardNames.indexOf(b.id) >= 0);
		for (let board of design.boards) {
			for (let cardInfo of board.cards) {
				let id = cardInfo.id;
				// URL or file path?
				let six = id.lastIndexOf('/');
				if (six >= 0) {
					id = id.substring(six + 1);
				}
				// extension?
				let dix = id.lastIndexOf('.');
				if (dix >= 0) {
					id = id.substring(0, dix);
				}
				if (cardInfo.id != id) {
					if (debug) console.log(`canonical card ${id} from ${cardInfo.id}`);
					cardInfo.id = id;
				}
			}
		}
	}
	// split by board?
	let designs = rawDesigns.filter((d) => d.boards && d.boards.length > 0);
	if (splitByBoard) {
		designs = [];
		for (let design of rawDesigns) {
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
	let cardUses: CardUse[] = [];
	for (let di in designs) {
		const design = designs[di];
		for (let board of design.boards) {
			for (let cardInfo of board.cards) {
				let cardUse: CardUse = cardUses.find((cu) => cu.id == cardInfo.id);
				if (!cardUse) {
					//if (debug) console.log(`add cardUse ${cardinfo.id} (design ${design.id})`);
					cardUse = {
						id: cardInfo.id,
						use: [],
					}
					cardUses.push(cardUse);
				}
				if (cardUse.use[di]) {
					cardUse.use[di].push(cardInfo);
				} else {
					cardUse.use[di] = [cardInfo];
				}
				//if (debug) console.log(`${cardUse.use[di].length} uses of card ${cardUse.id} in design ${design.id}`);
			}
		}
	}
	switch (exportType) {
		case AnalysisExportTypes.CARD_USE: {
			return await exportCardUse(designs, cardUses, includeDetail);
		}
		case AnalysisExportTypes.CARD_ADJACENCY: {
			return await exportCardAdjacency(designs, cardUses);
		}
		default: {
			console.log(`unknown export type ${exportType}`);
		}
	}
	return "Error";
}

async function exportCardUse(designs: DesignInfo[], cardUses: CardUse[], includeDetail: boolean): Promise<string> {
	let rows: string[][] = [];
	// titles
	let columns: string[] = [];
	columns.push('Id');
	for (let di in designs) {
		columns.push(designs[di].id);
	}
	rows.push(columns);
	for (let cardUse of cardUses) {
		let row: string[] = [];
		row.push(cardUse.id);
		for (let di in designs) {
			let use = cardUse.use[di];
			if (use) {
				if (includeDetail) {
					let detail = use.map((u) => u.zones.map((z) => z.zoneId));
					row.push(JSON.stringify(detail));
				} else {
					row.push(`${use.length}`);
				}
			} else {
				row.push('');
			}
		}
		rows.push(row);
	}
	return await arrayToCsv(rows);
}

async function readDesigns(analysis: Analysis): Promise<DesignInfo[]> {
	const db = await getDb();
	// get real snapshots
	let designs: DesignInfo[] = [];
	for (let s of analysis.snapshots) {
		const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots').findOne({
			_id: s._id
		});
		if (!snapshot) {
			if (debug) console.log(`cannot find real snapshot ${s._id}`);
			continue;
		}
		const client = getClient(snapshot.sessionType);
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

async function exportCardAdjacency(designs: DesignInfo[], cardUses: CardUse[]): Promise<string> {
	let rows: string[][] = [];
	let columns: string[] = [''];
	for (let cardUse of cardUses) {
		columns.push(cardUse.id);
	}
	rows.push(columns);
	for (let cu1 of cardUses) {
		let row: string[] = [cu1.id];
		for (let cu2 of cardUses) {
			if (cu1.id == cu2.id) {
				row.push('0');
				continue;
			}
			let count = 0;
			for (let di in designs) {
				if (cu1.use[di] && cu2.use[di]) {
					count++;
				}
			}
			row.push(`${count}`);
		}
		rows.push(row);
	}
	return await arrayToCsv(rows);
}
