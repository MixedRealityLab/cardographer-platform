import { Client } from './types.ts';
import type {Session,SessionSnapshot} from '$lib/types.ts';
import type {SnapshotInfo,BoardInfo,CardInfo} from '$lib/analysistypes.ts';

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
};
export interface WidgetData {
	bounds: Bounds;
	childrenIds?: string[]; // frame
	clientVisible: true;
	frameIndex?: number; // frame
	groupId?: string; // frame, shape?
	height?: number; // not image
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
	width?: number; // not image
	height: number;
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
	acceptsImport(data : any): boolean {
		if (data.id && data.widgets && Array.isArray(data.widgets))
			return true;
		return false;
	}
	sessionType(): string {
		return 'miro';
	}
	makeSession(d: any): Session {
		const now = new Date().toISOString();
		const data = d as MiroData;
		let session:Session = {
			_id: '',
			name: data.title,
			description: data.dscription,
			credits: data.owners && data.owners.length>0 ? data.owners[0].name : '',
			owners: [],
			stages: [],
			currentStage: 0,
			created: now,
			lastModified: now,
			isPublic: false,
			isTemplate: false,
			isArchived: false,
			sessionType: 'miro',
		};
		return session;
	}
	makeSessionSnapshot(d: any): SessionSnapshot {
		const data = d as MiroData;
		const now = new Date().toISOString();
		let snapshot:SessionSnapshot = {
			_id:'',
			sessionId: '',
			sessionName: data.title,
			sessionDescription: data.description,
			sessionCredits: data.owners && data.owners.length>0 ? data.owners[0].name : '',
			sessionType: 'miro',
			originallyCreated: data.createdAt,
			snapshotDescription: `Imported from legacy data ${data._id}, miro board ${data.id}`,
			owners: [],
			created: now,
			isPublic: false,
			isNotForAnalysis: false,
			legacyId: data._id,
			miroData: data,
		};
		return snapshot;
	}
	getExistingSessionQuery(d: any) : any {
		const data = d as MiroData;
		return {
			miroId: d.id
		};
	}
	getSnapshotInfo(snapshot:SessionSnapshot): SnapshotInfo {
		let boards:BoardInfo[] = [];
		// frame is a board
		// card is an image
		for (let widget of snapshot.miroData.widgets) {
			if (widget.type != WidgetType.IMAGE) {
				continue;
			}
			let id = widget.title || widget.url;
			if (!id) {
				if (debug) console.log(`ignore unnamed image`, widget);
				continue;
			}
			let ci:CardInfo = { id, zones:[] };
			let frames:WidgetData[] = snapshot.miroData.widgets.filter((w) => w.type==WidgetType.FRAME && cardInBounds(widget, w));
			let boardId = '';
			if (frames.length==0) {
				if(debug) console.log(`no board for image ${id} ${widget.id}`);
			} else {
				if (frames.length>1) {
					if (debug) console.log(`${frames.length} possible boards for image ${id} ${widget.id}`);
				}
				boardId = frames[0].title;
			}
			let board = boards.find((b) => b.id == boardId);
			if (!board) {
				if (debug) console.log(`add board ${boardId}`);
				board = { 
					id:boardId,
					cards:[],
				};
				boards.push(board);
			}
			board.cards.push(ci);
			let shapes:WidgetData[] = snapshot.miroData.widgets.filter((w) => w.type==WidgetType.SHAPE && cardInBounds(widget, w));
			for (let shape of shapes) {
				ci.zones.push({zoneId: shape.plainText});
			}
			if (debug) console.log(`card ${id} in ${ci.zones.length} zones: ${JSON.stringify(ci.zones)}`);
		}
		// TODO comment is a shape or sticker
		return {
			boards
		};
	}
}
function cardInBounds(c: WidgetData, w:WidgetData) {
	return c.x >= w.bounds.left && c.x <= w.bounds.right &&
		c.y <= w.bounds.bottom && c.y >= w.bounds.top;
}

