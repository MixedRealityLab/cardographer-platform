// for analysis

import type {CardInfo} from "$lib/types";

export interface SnapshotInfo {
	boards: BoardInfo[];
}

export interface BoardInfo {
	id: string;
	cards: CardSnapshot[];
	comments?: CommentInfo[];
}

export interface CardSnapshot {
	id: string
	x?: number
	y?: number
	info?: CardInfo
	zones?: CardZone[]
	comments?: string[]
	//scales?: CardScale[]

}

export interface CommentInfo {
	text: string;
	zones?: CardZone[];
	scales?: CardScale[];
}

export interface CardZone {
	zoneId: string;
}

export interface CardScale {
	scaleId: string;
	value: number;
}

export enum AnalysisExportTypes {
	CARD_USE = "card_use",
	CARD_ADJACENCY = "card_adjacency",
//	CARD_NODES = "card_nodes",
//	DESIGN_ADJACENCY = "design_adjacency",
//	DESIGN_NODES = "design_nodes",
}

