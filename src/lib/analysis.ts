import type {BoardInfo, CardSnapshot} from '$lib/analysistypes'
import {AnalysisExportTypes} from '$lib/analysistypes'
import {getClient} from '$lib/clients'
import {hexValue, plasmaColour} from "$lib/colour"
import {arrayToCsv} from '$lib/csvutils'
import {getDb} from '$lib/db'
import type {Analysis, CardDeckRevision, CardInfo, Session, SessionSnapshot} from '$lib/types'
import {RegionType} from '$lib/types'

const coolGray = {
	600: '#4b5563',
}

const debug = true;

interface DesignInfo {
	id: string;
	snapshot: SessionSnapshot;
	boards: BoardInfo[];
}

interface CardUse {
	id: string;
	info?: CardInfo
	use: CardSnapshot[][]
	comments: string[]
}

const useZones = true

export async function analysisNodeGraph(analysis: Analysis) {
	const rawDesigns: DesignInfo[] = await readDesigns(analysis)
	const boards: BoardInfo[] = []
	for (const design of rawDesigns) {
		for (const bi in design.boards) {
			const board = design.boards[bi];
			boards.push(board)
		}
	}

	const categories: string[] = []
	const cardUses: CardUse[] = []
	const regions = []
	let analysisRegions = analysis.regions
	if (!analysisRegions) {
		analysisRegions = []
	}
	for (const bi in boards) {
		const board = boards[bi];
		let region = regions.find((reg) => reg.name === board.id)
		if (!region) {
			const analysisRegion = analysisRegions.find((analysisRegion) => analysisRegion.name === board.id)
			region = {
				name: board.id,
				regions: []
			}
			if (analysisRegion) {
				region.type = analysisRegion.type
				region.colour = analysisRegion.colour
			} else {
				region.type = RegionType.Category
				region.color = "magma"
			}
			regions.push(region)
		}
		for (const cardInfo of board.cards) {
			let cardUse: CardUse = cardUses.find((cu) => cu.id === cardInfo.id);
			if (!cardUse) {
				cardUse = {
					id: cardInfo.id,
					info: cardInfo.info,
					use: [],
					comments: []
				}

				cardUses.push(cardUse);
			}

			for (const zone of cardInfo.zones) {
				if (zone.zoneId && region.regions.indexOf(zone.zoneId) === -1) {
					region.regions.push(zone.zoneId)
				}
			}

			for(const comment of cardInfo.comments) {
				cardUse.comments.push(comment)
			}

			if (cardUse.info && cardUse.info.category) {
				const index = categories.indexOf(cardUse.info.category)
				if (index == -1) {
					categories.push(cardUse.info.category)
				}
			}
			if (cardUse.use[bi]) {
				cardUse.use[bi].push(cardInfo);
			} else {
				cardUse.use[bi] = [cardInfo];
			}
			if (!cardUse.info && cardInfo.info) {
				cardUse.info = cardInfo.info
			}
		}
	}
	console.log(JSON.stringify(regions))
	console.log(JSON.stringify(cardUses))

	const nodes = []
	const edges = []

	for (let cardIndex1 = 0; cardIndex1 < cardUses.length; cardIndex1++) {
		const cardUse1 = cardUses[cardIndex1]
		const cardColors: number[] = []
		const zones: string[] = []
		let count = 0
		for (const bi in boards) {
			const cu = cardUse1.use[bi]
			if (cu) {
				const board = boards[bi]
				const region = regions.find((region) => region.name === board.id)
				if (region.type !== RegionType.Ignore) {
					for (const use of cu) {
						if (region.type === RegionType.XAxis && use.x) {
							cardColors.push(use.x)
						} else if (region.type === RegionType.YAxis && use.y) {
							cardColors.push(use.y)
						} else if (region.type === RegionType.Category && cardUse1.info && cardUse1.info.category) {
							const index = categories.indexOf(cardUse1.info.category)
							const mix = index / (categories.length - 1)
							cardColors.push(mix)
						}

						for (const zone of use.zones) {
							if (zone.zoneId === "") {
								if (zones.indexOf(board.id) === -1) {
									zones.push(board.id)
								}
							} else if (zones.indexOf(zone.zoneId) === -1) {
								zones.push(zone.zoneId)
							}
							count++
						}
					}
				}
			}
		}
		zones.sort()
		if (count > 0) {
			let colour = coolGray["600"]
			if (cardColors.length > 0) {
				const colourMix = (cardColors.reduce((sum, v) => sum + v || 0) / cardColors.length)
				colour = hexValue(plasmaColour(colourMix))
			}

			nodes.push({
				data: {
					id: cardUse1.id,
					label: cardUse1.info && cardUse1.info.name || cardUse1.id,
					description: cardUse1.info && cardUse1.info.description || '',
					comments: cardUse1.comments,
					colour: colour,
					zones: zones,
					count: count
				}
			})
			for (let cardIndex2 = 0; cardIndex2 < cardIndex1; cardIndex2++) {
				const cardUse2 = cardUses[cardIndex2]
				let count = 0;
				for (const bi in boards) {
					const board = boards[bi]
					const region = regions.find((region) => region.name === board.id)
					if (region.type !== RegionType.Ignore) {
						if (cardUse1.use[bi] && cardUse2.use[bi]) {
							if (useZones) {
								for (const use1 of cardUse1.use[bi]) {
									for (const zone of use1.zones) {
										for (const use2 of cardUse2.use[bi]) {
											if (use2.zones.find((zone2) => zone2.zoneId === zone.zoneId) !== undefined) {
												count++
											}
										}
									}
								}
							} else {
								count++;
							}
						}
					}
				}
				if (count != 0) {
					edges.push({
						data: {
							id: cardUse1.id + ":" + cardUse2.id,
							source: cardUse1.id,
							target: cardUse2.id,
							value: count / 2
						}
					})
				}
			}
		}
	}

	const max = Math.max(...nodes.map((node) => node.data.count))
	nodes.forEach((node) => {
		node.data.size = (((node.data.count - 1) / (max - 1)) + 1) * 20 || 20
	})

	return {
		nodes: nodes,
		edges: edges,
		regions: regions
	}
}

export async function exportAnalysisAsCsv(analysis: Analysis, exportType: AnalysisExportTypes, splitByBoard: boolean, includeDetail: boolean, boardNames: string[]): Promise<string> {
	const rawDesigns: DesignInfo[] = await readDesigns(analysis);
	// canonicalize card ids and filter boards
	for (const design of rawDesigns) {
		// filter boards
		design.boards = design.boards.filter((b) => !boardNames || boardNames.indexOf(b.id) >= 0);
	}
	// split by board?
	let designs = rawDesigns.filter((d) => d.boards && d.boards.length > 0);
	if (splitByBoard) {
		designs = [];
		for (const design of rawDesigns) {
			for (const bi in design.boards) {
				const board = design.boards[bi];
				const id = board.id ? `${design.id}:${board.id}` : design.id;
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
	const cardUses: CardUse[] = [];
	for (const di in designs) {
		const design = designs[di];
		for (const board of design.boards) {
			for (const cardInfo of board.cards) {
				let cardUse: CardUse = cardUses.find((cu) => cu.id == cardInfo.id);
				if (!cardUse) {
					//if (debug) console.log(`add cardUse ${cardinfo.id} (design ${design.id})`);
					cardUse = {
						id: cardInfo.id,
						use: [],
						comments: []
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
	const rows: string[][] = [];
	// titles
	const columns: string[] = [];
	columns.push('Id');
	for (const di in designs) {
		columns.push(designs[di].id);
	}
	rows.push(columns);
	for (const cardUse of cardUses) {
		const row: string[] = [];
		row.push(cardUse.id);
		for (const di in designs) {
			const use = cardUse.use[di];
			if (use) {
				if (includeDetail) {
					const detail = use.map((u) => u.zones.map((z) => z.zoneId));
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
	const designs: DesignInfo[] = [];
	for (const snapshotId of analysis.snapshotIds) {
		const snapshot = await db.collection<SessionSnapshot>('SessionSnapshots').findOne({
			_id: snapshotId
		});
		if (!snapshot) {
			if (debug) console.log(`cannot find real snapshot ${snapshotId}`);
			continue;
		}
		const client = getClient(snapshot.sessionType);
		if (!client) {
			console.log(`cannot find client for sessionType ${snapshot.sessionType}`);
			continue;
		}
		const info = client.getSnapshotInfo(snapshot);
		const session = await db.collection<Session>('Sessions').findOne({
			_id: snapshot.sessionId
		})
		if (!session) {
			if (debug) console.log(`cannot find real snapshot ${snapshotId}`);
			continue;
		}

		const boards = info.boards
		for (const board of boards) {
			for (const cardInfo of board.cards) {
				let id = cardInfo.id;
				// URL or file path?
				const six = id.lastIndexOf('/');
				if (six >= 0) {
					id = id.substring(six + 1);
				}
				// extension?
				const dix = id.lastIndexOf('.');
				if (dix >= 0) {
					id = id.substring(0, dix);
				}
				if (cardInfo.id != id) {
					if (debug) console.log(`canonical card ${id} from ${cardInfo.id}`);
					cardInfo.id = id;
				}
			}
		}
		// if (session.board) {
		// 	boards = info.boards.filter((board) => {
		// 		const region = session.board.regions.find((region) => region.id === board.id)
		// 		return !region || region.analyse
		// 	})
		// }


		if (session.decks) {
			for (const sessionDeck of session.decks) {
				const deck = await db.collection<CardDeckRevision>('CardDeckRevisions').findOne({
					deckId: sessionDeck.deckId,
					revision: sessionDeck.revision
				})
				if (deck && deck.cards) {
					for (const board of boards) {
						for (const card of board.cards) {
							const info = deck.cards.find((deckCard) => deckCard.id === card.id)
							if (info) {
								card.info = info
							}
						}
					}
				}
			}
		}

		designs.push({
			id: snapshot._id,
			snapshot,
			boards: boards
		})
	}
	console.log(designs)
	//console.log(`extract something from ${snapshots.length} snapshots...`);
	return designs;
}

async function exportCardAdjacency(designs: DesignInfo[], cardUses: CardUse[]): Promise<string> {
	const rows: string[][] = [];
	const columns: string[] = [''];
	for (const cardUse of cardUses) {
		columns.push(cardUse.id);
	}
	rows.push(columns);
	for (const cu1 of cardUses) {
		const row: string[] = [cu1.id];
		for (const cu2 of cardUses) {
			if (cu1.id == cu2.id) {
				row.push('0');
				continue;
			}
			let count = 0;
			for (const di in designs) {
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
