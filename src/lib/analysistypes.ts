// for analysis

import type {CardInfo} from "$lib/types";

export interface SnapshotInfo {
	boards: BoardInfo[];
}

export interface BoardInfo {
	id: string;
	cards: CardSnapshot[];
	comments?: CommentInfo[];
	zones?: ZoneInfo[];
}

export interface CommonInfo {
	x?: number
	y?: number
	zones?: CardZone[];
}

export interface CardSnapshot extends CommonInfo {
	id: string
	info?: CardInfo
	comments?: string[]
	//scales?: CardScale[]
}

export interface CommentInfo extends CommonInfo {
	text: string;
	scales?: CardScale[];
}

export interface CardZone {
	zoneId: string;
	overlap: number; // 0-1
}

export interface CardScale {
	scaleId: string;
	value: number;
}

export interface ZoneInfo {
	id: string
}

export enum AnalysisExportTypes {
	CARD_USE = "card_use",
	CARD_ADJACENCY = "card_adjacency",
//	CARD_NODES = "card_nodes",
//	DESIGN_ADJACENCY = "design_adjacency",
//	DESIGN_NODES = "design_nodes",
}

