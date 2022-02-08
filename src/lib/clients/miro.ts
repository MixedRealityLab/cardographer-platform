import type {BoardInfo, CardSnapshot, SnapshotInfo} from '$lib/analysistypes';
import type {Session, SessionSnapshot} from '$lib/types';
import {Client} from './types';

const debug = true;

export interface MiroData {
	id: string;
	widgets: WidgetData[];
	createdAt: string; //ISO
	description: string;
	owner: UserData;
	title: string;
	updatedAt: string; //ISO
	_id: string; // dump
}

export interface UserData {
	name: string;
	//...
}

export enum WidgetType {
	FRAME = "FRAME",
	IMAGE = "IMAGE",
	SHAPE = "SHAPE",
	STICKER = "STICKER",
	//GROUP = "GROUP",
	LINE = "LINE",
}

export interface WidgetData {
	bounds: Bounds;
	childrenIds?: string[]; // frame
	clientVisible: true;
	frameIndex?: number; // frame
	groupId?: string; // frame, shape?
	id: string;
	metadata: any;
	plainText?: string; // sticker, shape
	rotation?: number; // image
	scale?: number; // image
	style: any;
	tags?: string[]; // sticker
	text?: string; // sticker, shape
	title: string; // frame, image
	type: WidgetType; // 'FRAME' 'IMAGE','STICKER', 'LINE','SHAPE'
	url?: string; // image
	x?: number
	y?: number
	width?: number; // not image
	height?: number; // not image
}

export interface Bounds {
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
	x: number;
	y: number;
}

export class MiroClient extends Client {
	acceptsImport(data: any): boolean {
		return !!(data.id && data.widgets && Array.isArray(data.widgets));
	}

	sessionType(): string {
		return 'miro';
	}

	makeSession(d: any): Session {
		const now = new Date().toISOString();
		const data = d as MiroData;
		return {
			_id: '',
			name: data.title,
			description: data.description || `Imported Miro board https://miro.com/app/board/${data.id}`,
			credits: data.owner && data.owner.name ? data.owner.name : '',
			owners: [],
			currentStage: 0,
			created: now,
			lastModified: now,
			isPublic: false,
			isTemplate: false,
			isArchived: false,
			sessionType: 'miro',
			decks: []
		}
	}

	makeSessionSnapshot(d: any): SessionSnapshot {
		const data = d as MiroData;
		const now = new Date().toISOString();
		return {
			_id: '',
			sessionId: '',
			sessionName: data.title,
			sessionDescription: data.description || `Imported Miro board https://miro.com/app/board/${data.id}`,
			sessionCredits: data.owner && data.owner.name ? data.owner.name : '',
			sessionType: 'miro',
			originallyCreated: data.createdAt,
			snapshotDescription: '',
			owners: [],
			created: now,
			isPublic: false,
			isNotForAnalysis: false,
			legacyId: data._id,
			data: data,
		};
	}

	getExistingSessionQuery(d: any): any {
		const data = d as MiroData;
		return {
			miroId: data.id
		};
	}

	getSnapshotInfo(snapshot: SessionSnapshot): SnapshotInfo {
		const boards: BoardInfo[] = [];
		// frame is a board
		// card is an image
		// shape is a zone
		const data = snapshot.data as MiroData
		for (const widget of data.widgets) {
			if (widget.type != WidgetType.IMAGE) {
				continue;
			}
			const id = widget.title || widget.url;
			if (!id) {
				if (debug) console.log(`ignore unnamed image`, widget);
				continue;
			}
			const ci: CardSnapshot = {id, zones: []};
			const frames: WidgetData[] = data.widgets.filter((w) => w.type == WidgetType.FRAME && w.title && w.childrenIds.includes(widget.id))//&& cardInBounds(widget, w));
			let boardId = '';
			if (frames.length == 0) {
				if (debug) console.log(`no board for image ${id} ${widget.id}`);
			} else {
				if (frames.length > 1) {
					if (debug) console.log(`${frames.length} possible boards for image ${id} ${widget.id}: ${JSON.stringify(frames.map((frame) => frame.title))}`);
				}
				boardId = frames[0].title
				ci.x = (widget.bounds.left - frames[0].bounds.left) / (frames[0].bounds.width - widget.bounds.width)
				ci.y = (widget.bounds.top - frames[0].bounds.top) / (frames[0].bounds.height - widget.bounds.height)
			}
			let board = boards.find((b) => b.id == boardId);

			if (!board) {
				if (debug) console.log(`add board ${boardId}`);
				board = {
					id: boardId,
					cards: [],
				};
				boards.push(board);
			}
			board.cards.push(ci);
			const shapes: WidgetData[] = data.widgets.filter((w) => w.type == WidgetType.SHAPE && cardInBounds(widget, w));
			for (const shape of shapes) {
				if (shape.plainText) {
					ci.zones.push({zoneId: shape.plainText});
				}
			}
			if (ci.zones.length === 0) {
				for (const frame of frames) {
					ci.zones.push({zoneId: frame.title});
				}
			}
			if (debug) console.log(`card ${id} in ${ci.zones.length} zones: ${JSON.stringify(ci.zones)}`);
		}
		// TODO comment is a shape or sticker
		return {
			boards
		};
	}
}

function cardInBounds(c: WidgetData, w: WidgetData) {
	return c.x >= w.bounds.left && c.x <= w.bounds.right &&
		c.y <= w.bounds.bottom && c.y >= w.bounds.top;
}

