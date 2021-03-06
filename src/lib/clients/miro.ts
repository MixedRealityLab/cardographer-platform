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
	//LINE = "LINE",
}

export interface WidgetData {
	bounds: Bounds;
	childrenIds?: string[]; // frame
	id: string;
	plainText?: string; // sticker, shape
	// TODO ? rotation?: number; // image
	style: any;
	text?: string; // sticker, shape
	title?: string; // frame, image
	type: WidgetType; // 'FRAME' 'IMAGE','STICKER', 'LINE','SHAPE'
	url?: string; // image
}

export interface Bounds {
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
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
		const widgetList = data.widgets.map((item) => this.normalizeWidget(item))
		for (const widget of widgetList) {
			if (widget.type != WidgetType.IMAGE) {
				continue;
			}
			const id = widget.title || widget.url;
			if (!id) {
				if (debug) console.log(`ignore unnamed image`, widget);
				continue;
			}
			const ci: CardSnapshot = {id, zones: []};
			let frames: WidgetData[] = widgetList.filter((w) => w.type == WidgetType.FRAME && w.title && w.childrenIds.includes(widget.id))
			if (frames.length == 0) {
				frames = widgetList.filter((w) => w.type == WidgetType.FRAME && w.title && cardInBounds(widget, w));
			}
			let boardId = '';
			if (frames.length == 0) {
				if (debug) console.log(`no board for image ${id} ${widget.id}`);
			} else {
				if (frames.length > 1) {
					if (debug) console.log(`${frames.length} possible boards for image ${id} ${widget.id}: ${JSON.stringify(frames.map((frame) => frame.title))}`);
				}
				let size = Infinity
				for (const frame of frames) {
					const widgetSize = frame.bounds.width * frame.bounds.height
					if (size < widgetSize || !boardId) {
						size = widgetSize
						boardId = frame.title
						ci.x = (widget.bounds.left - frame.bounds.left) / (frame.bounds.width - widget.bounds.width)
						ci.y = (widget.bounds.top - frame.bounds.top) / (frame.bounds.height - widget.bounds.height)
					}
				}
			}

			ci.comments = widgetList.filter((w) => w.type == WidgetType.STICKER && w.text && cardOverlapping(widget, w)).map((w) => w.text)

			let board = boards.find((b) => b.id == boardId);

			if (!board) {
				if (debug) console.log(`add board ${boardId}`);
				board = {
					id: boardId,
					cards: [],
				}
				boards.push(board)
			}
			board.cards.push(ci);
			const shapes: WidgetData[] = widgetList.filter((w) => w.type == WidgetType.SHAPE && cardInBounds(widget, w));
			for (const shape of shapes) {
				if (shape.plainText) {
					ci.zones.push({zoneId: shape.plainText});
				}
			}
			if (ci.zones.length == 0) {
				for (const frame of frames) {
					ci.zones.push({zoneId: frame.title});
				}
			}
			if (debug) console.log(`card ${id} in ${ci.zones.length} zones: ${JSON.stringify(ci.zones)}`);
		}
		return {boards}
	}

	normalizeWidget(widget: any): WidgetData {
		// Convert api v2.0 style items to v1.1 style widgets
		widget.type = WidgetType[widget.type.replace('sticky_note', 'sticker').toUpperCase()]
		if(!widget.bounds && widget.x && widget.y && widget.width && widget.height) {
			if(widget.origin != "center") {
				console.warn("Unexpected origin: " + widget.origin);
			}
			widget.bounds = {
				left: widget.x - (widget.width / 2),
				right: widget.x + (widget.width / 2),
				top: widget.y - (widget.height / 2),
				bottom: widget.y + (widget.height / 2),
				width: widget.width,
				height: widget.height
			}
		}
		return widget
	}
}

function cardInBounds(c: WidgetData, w: WidgetData) {
	return c.bounds.left >= w.bounds.left && c.bounds.right <= w.bounds.right &&
		c.bounds.bottom <= w.bounds.bottom && c.bounds.top >= w.bounds.top;
}

function cardOverlapping(c: WidgetData, w: WidgetData) {
	return c.bounds.left <= w.bounds.right && c.bounds.right >= w.bounds.left && c.bounds.top <= w.bounds.bottom && c.bounds.bottom >= w.bounds.top;
}