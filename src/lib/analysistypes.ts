// for analysis

export interface SnapshotInfo {
	boards: BoardInfo[];
}

export interface BoardInfo {
	id: string;
	cards: CardInfo[];
	comments?: CommentInfo[];
}

export interface CardInfo {
	id: string;
	zones?: CardZone[];
	scales?: CardScale[];
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

