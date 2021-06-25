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

