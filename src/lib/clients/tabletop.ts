import type {BoardInfo, CardSnapshot, SnapshotInfo} from '$lib/analysistypes';
import type {Session, SessionSnapshot} from '$lib/types';
import {Client} from './types';

const debug = true;

export class TabletopClient extends Client {
	acceptsImport(data: any): boolean {
		return false
	}

	sessionType(): string {
		return 'tabletop';
	}

	makeSession(data: any): Session {
		const now = new Date().toISOString();
		return {
			_id: '',
			name: data.title,
			description: data.description || `Tabletop Session https://miro.com/app/board/${data.id}`,
			credits: data.owner && data.owner.name ? data.owner.name : '',
			owners: [],
			created: now,
			lastModified: now,
			isPublic: false,
			isTemplate: false,
			isArchived: false,
			sessionType: 'tabletop',
			decks: []
		}
	}

	makeSessionSnapshot(data: any): SessionSnapshot {
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

	getExistingSessionQuery(data: any): any {
		return {
			miroId: data.id
		};
	}

	getSnapshotInfo(snapshot: SessionSnapshot): SnapshotInfo {
		const boards: BoardInfo[] = [];
		// frame is a board
		// card is an image
		// shape is a zone
		const data = snapshot.data
		for (const widget of data.widgets) {
			if (widget.type != 'image') {
				continue;
			}
			const id = widget.title || widget.url;
			if (!id) {
				if (debug) console.log(`ignore unnamed image`, widget);
				continue;
			}
			const ci: CardSnapshot = {id, zones: []};
			let frames = data.widgets.filter((w) => w.type == 'frame' && w.title && w.childrenIds.includes(widget.id))
			if (frames.length == 0) {
				frames = data.widgets.filter((w) => w.type == 'frame' && w.title && cardInBounds(widget, w));
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

			ci.comments = data.widgets.filter((w) => w.type == 'sticker' && w.text && cardOverlapping(widget, w)).map((w) => w.text)

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
			const shapes = data.widgets.filter((w) => w.type == 'shape' && cardInBounds(widget, w));
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
}

function cardInBounds(c, w) {
	return c.bounds.left >= w.bounds.left && c.bounds.right <= w.bounds.right &&
		c.bounds.bottom <= w.bounds.bottom && c.bounds.top >= w.bounds.top;
}

function cardOverlapping(c, w) {
	return c.bounds.left <= w.bounds.right && c.bounds.right >= w.bounds.left && c.bounds.top <= w.bounds.bottom && c.bounds.bottom >= w.bounds.top;
}